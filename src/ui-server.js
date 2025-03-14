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

// Create an Express application
const app = express();
let server;
let io;

// Store running state
let isRunning = false;
let port = 3000;

// Handle console output capture for streaming to UI
class OutputCapture {
  constructor(socket, sessionId) {
    this.socket = socket;
    this.sessionId = sessionId;
    this.originalConsoleLog = console.log;
    this.originalConsoleError = console.error;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleInfo = console.info;
  }

  start() {
    // Override console methods to capture output
    console.log = (...args) => {
      this.originalConsoleLog(...args);
      this.emit('log', args);
    };

    console.error = (...args) => {
      this.originalConsoleError(...args);
      this.emit('error', args);
    };

    console.warn = (...args) => {
      this.originalConsoleWarn(...args);
      this.emit('warn', args);
    };

    console.info = (...args) => {
      this.originalConsoleInfo(...args);
      this.emit('info', args);
    };
  }

  stop() {
    // Restore original console methods
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    console.info = this.originalConsoleInfo;
  }

  emit(type, args) {
    // Format and emit log messages to the client
    const formattedArgs = args.map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    });

    this.socket.emit('console', {
      type,
      message: formattedArgs.join(' '),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    });
  }
}

// Start the UI server
async function start(options = {}) {
  if (isRunning) {
    console.log(chalk.yellow('UI server is already running.'));
    return;
  }

  port = options.port || 3000;
  const cwd = options.cwd || process.cwd();

  // Configure middleware
  app.use(cors());
  app.use(express.json());

  // Static file serving will be added here once we build the frontend
  // For now, we'll just serve a placeholder page
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lambda Running UI</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #1e1e1e;
            color: #e1e1e1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
          }
          h1 {
            color: #7e57c2;
            margin-bottom: 1rem;
          }
          p {
            max-width: 600px;
            line-height: 1.6;
          }
          .loading {
            margin-top: 2rem;
            font-style: italic;
            color: #888;
          }
        </style>
      </head>
      <body>
        <h1>Lambda Running UI</h1>
        <p>The full UI is coming soon. We're working on an elegant, powerful interface for testing your Lambda functions.</p>
        <p class="loading">Loading resources...</p>
        
        <script>
          // Simple script to connect to WebSocket for basic demo
          const socket = new WebSocket('ws://' + window.location.host + '/socket.io/?EIO=4&transport=websocket');
          
          socket.onopen = () => {
            console.log('Connected to server');
            document.querySelector('.loading').textContent = 'Connected to server! Full UI coming soon.';
          };
          
          socket.onclose = () => {
            console.log('Disconnected from server');
            document.querySelector('.loading').textContent = 'Disconnected from server.';
          };
        </script>
      </body>
      </html>
    `);
  });

  // API endpoints

  // Get all Lambda handlers
  app.get('/api/handlers', (req, res) => {
    try {
      const handlers = scanForHandlers(cwd, ['.js', '.ts'], {
        ignoreNodeModules: true,
        useIgnoreFile: true,
      });

      res.json({ handlers });
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

  // Create HTTP server and Socket.io instance
  server = http.createServer(app);
  io = new Server(server);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log(chalk.green('Client connected to UI'));

    // Handler execution
    socket.on('run-handler', async (data) => {
      const { handlerPath, handlerMethod, eventData, sessionId } = data;

      // Capture console output
      const outputCapture = new OutputCapture(socket, sessionId);
      outputCapture.start();

      try {
        socket.emit('execution-start', { sessionId });

        const startTime = Date.now();
        const result = await runHandler(
          handlerPath,
          handlerMethod,
          eventData || {},
          {},
          {
            loadEnv: true,
          }
        );
        const duration = Date.now() - startTime;

        socket.emit('execution-result', {
          success: true,
          result,
          duration,
          sessionId,
        });
      } catch (error) {
        socket.emit('execution-result', {
          success: false,
          error: {
            message: error.message,
            stack: error.stack,
          },
          sessionId,
        });
      } finally {
        outputCapture.stop();
        socket.emit('execution-end', { sessionId });
      }
    });

    socket.on('disconnect', () => {
      console.log(chalk.yellow('Client disconnected from UI'));
    });
  });

  // Start the server
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      isRunning = true;
      console.log(chalk.green(`Lambda Running UI server started on http://localhost:${port}`));

      if (options.open) {
        open(`http://localhost:${port}`);
      }

      resolve();
    });

    server.on('error', (error) => {
      isRunning = false;

      if (error.code === 'EADDRINUSE') {
        console.error(chalk.red(`Port ${port} is already in use. Try a different port.`));
      } else {
        console.error(chalk.red(`Failed to start UI server: ${error.message}`));
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
      console.log(chalk.yellow('Lambda Running UI server stopped'));
      resolve();
    });
  });
}

module.exports = {
  start,
  stop,
};
