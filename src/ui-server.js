/**
 * Lambda Running UI Server
 * Provides a web interface for testing AWS Lambda functions
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const open = require('open');
const cors = require('cors');
const chalk = require('chalk');
const { scanForHandlers, runHandler } = require('./lambda-runner');
const { saveEvent, getEvents, getEvent, deleteEvent } = require('./event-store');
const path = require('path');
const fs = require('fs');

// Create an Express application
const app = express();
let server;
let io;

// Store running state
let isRunning = false;

// Configure global logging functions
function setupGlobalLogging() {
  // Global function to print explicit Lambda logs
  global.lambdaLog = (...args) => {
    console.log(`[LAMBDA] ${args.join(' ')}`);
  };

  // Global function to print system logs (which will be filtered and won't appear in the Output)
  global.systemLog = (...args) => {
    console.info(`[SYSTEM] ${args.join(' ')}`);
  };
}

// Initialize global logging functions
setupGlobalLogging();

// Handle console output capture for streaming to UI
class OutputCapture {
  constructor(socket, sessionId) {
    this.socket = socket;
    this.sessionId = sessionId;
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleInfo = console.info;

    // Flag to mark when we are in capture mode
    this.isCapturing = false;

    // Flag to identify if we are in handler code or library code
    this.inHandlerCode = false;

    // List of system logs that should be ignored
    this.systemLogs = [
      'Starting execution of handler:',
      'Loading environment variables from',
      'Execution started',
      'Execution completed',
      'Handler returned result:',
      'Auth token refreshed',
      'Using TypeScript configuration',
      'Executing handler',
      'Socket connected',
      'Socket disconnected',
      'Client connected to UI',
      'Client disconnected from UI',
      'Lambda Running UI server',
      'UI server is already running',
      'transpileOnly',
      'require.resolve',
      'ts-node',
      'tsconfig',
      'Event data:',
      'Execution completed in',
      'Starting execution of',
      'Error details:',
      'Error:',
      'Starting lambda-running',
      'Could not open browser',
      'UI available at',
      'Scanned for handlers',
      'Ignoring file',
      'Processing file',
      'Import resolver',
      'AWS SDK',
      'Lambda Running',
    ];
  }

  start() {
    // Activate capture
    this.isCapturing = true;

    // Emit start message
    this.emit('info', ['Lambda execution started']);

    // Override console methods to capture everything during execution
    console.log = (...args) => {
      this.originalConsoleLog(...args);
      this.processLog('log', args);
    };

    console.error = (...args) => {
      this.originalConsoleError(...args);
      this.processLog('error', args);
    };

    console.warn = (...args) => {
      this.originalConsoleWarn(...args);
      this.processLog('warn', args);
    };

    console.info = (...args) => {
      this.originalConsoleInfo(...args);
      this.processLog('info', args);
    };
  }

  stop() {
    // Deactivate capture
    this.isCapturing = false;

    // Restore original methods
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    console.info = this.originalConsoleInfo;
  }

  // Method to process logs and filter system logs
  processLog(type, args) {
    if (!this.isCapturing) return;

    // If it's a system log, don't emit it at all
    if (this.isSystemLog(args)) {
      return;
    }

    // Check if the first argument is an Error object (including exceptions like AuthenticationException)
    if (args.length > 0 && args[0] instanceof Error) {
      const error = args[0];
      // Get the real name of the error class using constructor.name which is more reliable
      const errorName = error.constructor.name || error.name || 'Error';

      // Emit the exception name with special formatting
      this.emit('error', [`${errorName} [Error]`]);

      // Emit the stack trace without the first line (which contains the name and message)
      if (error.stack) {
        const stackLines = error.stack.split('\n');
        // Only emit stack lines without the first one that already contains the error
        if (stackLines.length > 1) {
          this.emit('error', [stackLines.slice(1).join('\n')]);
        }
      } else if (error.message) {
        this.emit('error', [error.message]);
      }
      return;
    }

    // Specific captures for errors and exceptions - we must ensure they are always shown
    if (type === 'error' && args.length > 0) {
      // If the first argument is a string that contains a specific error or stack trace,
      // make sure to show it even if it contains system patterns
      const firstArg = String(args[0]);

      // Detect specific patterns for errors and exceptions
      if (
        firstArg.includes('Error') ||
        firstArg.includes('Exception') ||
        firstArg.includes('at ') || // Stack trace lines
        firstArg.includes('Failed') ||
        firstArg.includes('Uncaught') ||
        /^\s+at\s/.test(firstArg)
      ) {
        // Stack trace lines with indentation
        this.emit('error', args);
        return;
      }
    }

    // If we get here, the log is from the lambda and should be emitted
    this.emit(type, args);
  }

  // Method to determine if a log is from the system
  isSystemLog(args) {
    if (args.length === 0) return false;

    // If the first argument is an Error, it should NEVER be considered a system log
    if (args[0] instanceof Error) {
      return false;
    }

    // Get the first argument as string for evaluation
    const firstArg = String(args[0]);

    // If the log starts with [SYSTEM], it's a system log and should be filtered
    if (typeof firstArg === 'string' && firstArg.startsWith('[SYSTEM]')) {
      return true;
    }

    // Errors and exceptions should never be considered system logs
    if (
      typeof firstArg === 'string' &&
      (firstArg.includes('Error') ||
        firstArg.includes('Exception') ||
        firstArg.includes('at ') || // To detect stack trace lines
        /^\s+at\s/.test(firstArg))
    ) {
      // To detect stack trace lines with indentation
      return false;
    }

    // If the log starts with [LAMBDA], it's not from the system (it's an explicit user log)
    if (typeof firstArg === 'string' && firstArg.startsWith('[LAMBDA]')) {
      // Remove the prefix for cleaner output
      args[0] = firstArg.substring('[LAMBDA]'.length).trim();
      return false;
    }

    // If the message comes from a lambda handler, allow it
    if (this.inHandlerCode) {
      return false;
    }

    // Check against known system log patterns
    for (const systemLogPrefix of this.systemLogs) {
      if (typeof firstArg === 'string' && firstArg.includes(systemLogPrefix)) {
        return true;
      }
    }

    // Additional patterns based on log analysis
    // Check if it's an internal library log
    if (
      (typeof firstArg === 'string' &&
        /^\[.*?\]/.test(firstArg) &&
        !firstArg.startsWith('[LAMBDA]')) || // Logs with [SOMETHING] format that are not [LAMBDA]
      firstArg.includes('lambda-running') ||
      firstArg.includes('Lambda Running') ||
      firstArg.includes('node_modules') ||
      firstArg.includes('Starting') ||
      firstArg.includes('Importing') ||
      firstArg.includes('Loading')
    ) {
      return true;
    }

    return false;
  }

  emit(type, args) {
    // Format and emit log messages to the client
    const formattedArgs = args.map((arg) => {
      // No attempt to JSON.stringify Error objects
      if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }

      // Convert to string preserving original format
      return String(arg);
    });

    // Combine arguments into a message
    let message = formattedArgs.join(' ');

    // Remove ALL timestamps in ANY format
    message = message.replace(/\[\d{2}:\d{2}:\d{2}\]\s*/g, ''); // [HH:MM:SS]
    message = message.replace(/\d{2}:\d{2}:\d{2}\s*/g, ''); // HH:MM:SS without brackets
    message = message.replace(/^\s*Error\s*$/i, ''); // Just the word "Error" alone

    // If after cleaning the message is empty, don't send it
    if (!message.trim()) {
      return;
    }

    // Detect if it's an exception message to apply special formatting
    let errorClass = '';

    // Detect different types of error messages
    if (type === 'error') {
      // Find the type of error message
      if (message.includes('[Error]')) {
        // It's a line with the exception name
        errorClass = 'error-message-heading';
      } else if (message.trim().startsWith('at ') || /^\s+at\s/.test(message)) {
        // It's a stack trace line
        errorClass = 'stack-trace';
      } else {
        // Generic error message
        errorClass = 'error-message';
      }
    }

    this.socket.emit('console', {
      type,
      message,
      errorClass,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });
  }
}

// Start the UI server
async function start(options = {}) {
  if (isRunning) {
    global.systemLog('UI server is already running.');
    return;
  }

  const startOptions = options || {};
  const port = startOptions.port || 3000;
  const shouldOpenBrowser = startOptions.open !== false;
  const projectDir = startOptions.cwd || process.cwd();
  const developmentMode = startOptions.developmentMode !== false;
  const moduleRoot = startOptions.moduleRoot || path.dirname(__dirname);
  
  // Log startup mode
  if (developmentMode) {
    global.systemLog('Starting in development mode (with hot reloading)');
  } else {
    global.systemLog('Starting in production mode (serving compiled files)');
  }

  // Configure middleware
  app.use(cors());
  app.use(express.json());

  // Configure API endpoints first - these need to be available in all modes
  
  // Simple healthcheck endpoint
  app.get('/api/healthcheck', (req, res) => {
    res.json({ 
      status: 'ok', 
      mode: developmentMode ? 'development' : 'production',
      timestamp: new Date().toISOString()
    });
  });

  // Get all Lambda handlers
  app.get('/api/handlers', (req, res) => {
    try {
      const handlers = scanForHandlers(projectDir, ['.js', '.ts'], {
        ignoreNodeModules: true,
        useIgnoreFile: true,
      });

      // Transform paths to be relative to projectDir
      const handlersWithRelativePaths = handlers.map((handler) => ({
        ...handler,
        path: path.relative(projectDir, handler.path).replace(/\\/g, '/'), // Convert Windows backslashes to forward slashes
      }));

      res.json({ handlers: handlersWithRelativePaths });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to scan for handlers',
        message: error.message,
      });
    }
  });

  // Get all saved events
  app.get('/api/events', (req, res) => {
    try {
      const events = getEvents(req.query.category || null);
      res.json({ events });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get events',
        message: error.message,
      });
    }
  });

  // Get a specific saved event
  app.get('/api/events/:name', (req, res) => {
    try {
      const event = getEvent(req.params.name, req.query.category || 'default');
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: `Event '${req.params.name}' not found`,
        });
      }

      res.json({ event });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get event',
        message: error.message,
      });
    }
  });

  // Save an event
  app.post('/api/events', (req, res) => {
    try {
      const { name, data, category = 'default' } = req.body;

      if (!name) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Event name is required',
        });
      }

      if (!data) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Event data is required',
        });
      }

      saveEvent(name, data, category);

      res.json({
        success: true,
        message: `Event '${name}' saved successfully`,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to save event',
        message: error.message,
      });
    }
  });

  // Delete an event
  app.delete('/api/events/:name', (req, res) => {
    try {
      const success = deleteEvent(req.params.name, req.query.category || 'default');

      if (!success) {
        return res.status(404).json({
          error: 'Event not found',
          message: `Event '${req.params.name}' not found`,
        });
      }

      res.json({
        success: true,
        message: `Event '${req.params.name}' deleted successfully`,
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete event',
        message: error.message,
      });
    }
  });

  // Run a Lambda handler
  app.post('/api/run', (req, res) => {
    try {
      const { handlerPath, handlerMethod } = req.body;

      if (!handlerPath || !handlerMethod) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Handler path and method are required',
        });
      }

      // This endpoint only initiates the execution
      // The actual execution and results are handled via WebSockets
      res.json({
        success: true,
        message: 'Execution initiated',
        sessionId: req.body.sessionId || Date.now().toString(),
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to initiate handler execution',
        message: error.message,
      });
    }
  });

  // Now configure UI serving based on mode
  if (developmentMode) {
    global.systemLog('Development mode active, API server only (UI will be served by Vite)');
  } else {
    // Production mode - Serve UI from lib/ui-dist
    const uiDistPath = path.join(moduleRoot, 'lib', 'ui-dist');
    global.systemLog(`Serving UI from bundled files at ${uiDistPath}`);
    
    if (fs.existsSync(uiDistPath) && fs.existsSync(path.join(uiDistPath, 'index.html'))) {
      global.systemLog(`UI static files found at ${uiDistPath}`);
      
      // Serve static files with proper cache control
      app.use(express.static(uiDistPath, {
        etag: true,
        lastModified: true,
        setHeaders: (res) => {
          res.setHeader('Cache-Control', 'public, max-age=86400');
        }
      }));
      
      // Handle root path explicitly - redirect to handlers view
      app.get('/', (req, res) => {
        res.redirect('/handlers');
      });
      
      // Handle all assets with explicit paths
      app.get('/assets/*', (req, res) => {
        const assetPath = path.join(uiDistPath, req.path);
        if (fs.existsSync(assetPath)) {
          res.sendFile(assetPath);
        } else {
          global.systemLog(`Asset not found: ${assetPath}`);
          res.status(404).send('Asset not found');
        }
      });
      
      // Serve index.html for all non-API routes (SPA routing)
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
          return next();
        }
        res.sendFile(path.join(uiDistPath, 'index.html'));
      });
    }
  }

  // Create HTTP server and Socket.io instance
  server = http.createServer(app);
  io = new Server(server);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    global.systemLog('Client connected to UI');

    // Store the current execution context to allow cancellation
    let currentExecutionContext = null;

    // Handler execution
    socket.on('run-handler', async (data) => {
      const { handlerPath, handlerMethod, eventData, sessionId } = data;

      // Capture console output
      const outputCapture = new OutputCapture(socket, sessionId);
      outputCapture.start();

      // Store the execution context
      currentExecutionContext = {
        sessionId,
        outputCapture,
        canceled: false,
      };

      try {
        socket.emit('execution-start', { sessionId });

        // Display event information (using systemLog)
        global.systemLog(`Event data: ${JSON.stringify(eventData || {}, null, 2)}`);

        // Here begins the actual execution of the user's handler
        // Mark that we are inside the handler code
        outputCapture.inHandlerCode = true;

        // Define startTime to measure execution duration
        const startTime = Date.now();

        let result;
        try {
          result = await runHandler(
            handlerPath,
            handlerMethod,
            eventData || {},
            {},
            {
              loadEnv: true,
            }
          );
        } catch (handlerError) {
          // Explicitly catch the handler error and process it
          // If it's an Error object, show all its details
          if (handlerError instanceof Error) {
            console.log(`ERROR: ${handlerError.name || 'Error'}: ${handlerError.message}`);

            // Show all enumerable properties of the error
            const errorProps = Object.keys(handlerError)
              .filter((key) => key !== 'name' && key !== 'message' && key !== 'stack')
              .reduce((obj, key) => {
                obj[key] = handlerError[key];
                return obj;
              }, {});

            if (Object.keys(errorProps).length > 0) {
              console.log('Error properties:', errorProps);
            }

            // Print the complete stack trace
            if (handlerError.stack) {
              console.log(handlerError.stack);
            }
          } else {
            // If it's not an Error object, show it as is
            console.log(handlerError);
          }

          // Re-throw for subsequent handling
          throw handlerError;
        }

        // After the execution is finished, we are back in library code
        outputCapture.inHandlerCode = false;

        const duration = Date.now() - startTime;

        // Check if execution was canceled during the run
        if (currentExecutionContext.canceled) {
          throw new Error('Execution canceled by user');
        }

        // Successful completion message (using systemLog)
        global.systemLog(`Execution completed in ${(duration / 1000).toFixed(2)}s`);
        global.systemLog('Execution completed successfully');

        socket.emit('execution-result', {
          success: true,
          result,
          duration,
          sessionId,
        });
      } catch (error) {
        // Check if this was a cancellation
        if (currentExecutionContext && currentExecutionContext.canceled) {
          // Cancellation message
          global.systemLog('Execution was cancelled by user');
          socket.emit('execution-stopped', { sessionId });
        } else {
          // Mark that we are back in library code
          outputCapture.inHandlerCode = false;

          // To ensure errors are displayed in the output,
          // we send the error directly to the terminal with the appropriate format
          socket.emit('console', {
            type: 'error',
            message: `Error: ${error.message}`,
            errorClass: 'error-message',
            timestamp: new Date().toISOString(),
            sessionId,
          });

          // If there is a stack trace, send it also
          if (error.stack) {
            socket.emit('console', {
              type: 'error',
              message: error.stack,
              errorClass: 'error-message',
              timestamp: new Date().toISOString(),
              sessionId,
            });
          }

          // If it's a specific error like AuthenticationException, ensure it's captured
          if (error.name && error.name !== 'Error') {
            socket.emit('console', {
              type: 'error',
              message: `Exception: ${error.name}: ${error.message}`,
              errorClass: 'error-message',
              timestamp: new Date().toISOString(),
              sessionId,
            });
          }

          // Error message (using systemLog)
          global.systemLog(`Execution failed: ${error.message}`);

          socket.emit('execution-result', {
            success: false,
            error: {
              message: error.message,
              stack: error.stack,
            },
            sessionId,
          });
        }
      } finally {
        outputCapture.stop();
        socket.emit('execution-end', { sessionId });
        currentExecutionContext = null;
      }
    });

    // Handle stop execution request
    socket.on('stop-execution', (data) => {
      const { sessionId } = data;

      // Only cancel if there's a running execution with matching sessionId
      if (currentExecutionContext && currentExecutionContext.sessionId === sessionId) {
        console.log(chalk.yellow(`Execution stopped by user for session ${sessionId}`));

        // Mark as canceled
        currentExecutionContext.canceled = true;

        // Send an immediate console message
        socket.emit('console', {
          type: 'warn',
          message: 'Execution was stopped by user',
          timestamp: Date.now(),
          sessionId,
        });

        // Send the stopped event
        socket.emit('execution-stopped', { sessionId });
      }
    });

    socket.on('disconnect', () => {
      global.systemLog('Client disconnected from UI');
    });
  });

  // Start the server
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      isRunning = true;
      global.systemLog(`Lambda Running UI server started on http://localhost:${port}`);

      if (shouldOpenBrowser) {
        // Open directly to handlers route for better UX
        open(`http://localhost:${port}/handlers`);
      }

      resolve();
    });

    server.on('error', (error) => {
      isRunning = false;

      if (error.code === 'EADDRINUSE') {
        global.systemLog(`Port ${port} is already in use. Try a different port.`);
      } else {
        global.systemLog(`Failed to start UI server: ${error.message}`);
      }

      reject(error);
    });
  });
}

// Stop the UI server
async function stop() {
  if (!isRunning || !server) {
    return;
  }

  return new Promise((resolve) => {
    server.close(() => {
      isRunning = false;
      global.systemLog('Lambda Running UI server stopped');
      resolve();
    });
  });
}

module.exports = {
  start,
  stop,
  __test_only_for_coverage__: {
    OutputCapture
  }
};

