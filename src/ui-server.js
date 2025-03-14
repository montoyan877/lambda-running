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

// Create an Express application
const app = express();
let server;
let io;

// Store running state
let isRunning = false;
let port = 3000;

// Configurar funciones globales de logging
function setupGlobalLogging() {
  // Función global para imprimir logs explícitos de Lambda
  global.lambdaLog = (...args) => {
    console.log(`[LAMBDA] ${args.join(' ')}`);
  };
  
  // Función global para imprimir logs de sistema (que serán filtrados y no aparecerán en el Output)
  global.systemLog = (...args) => {
    console.info(`[SYSTEM] ${args.join(' ')}`);
  };
}

// Inicializar las funciones globales de logging
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
    
    // Flag para marcar cuando estamos en modo captura
    this.isCapturing = false;
    
    // Flag para identificar si estamos en código de handler o librería
    this.inHandlerCode = false;
    
    // Lista de logs del sistema que deberíamos ignorar
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
      'Lambda Running'
    ];
  }

  start() {
    // Activar captura
    this.isCapturing = true;
    
    // Emitir mensaje de inicio
    this.emit('info', ['Lambda execution started']);
    
    // Sobrescribir métodos de consola para capturar todo durante la ejecución
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
    // Desactivar captura
    this.isCapturing = false;
    
    // Restaurar métodos originales
    console.log = this.originalConsoleLog;
    console.error = this.originalConsoleError;
    console.warn = this.originalConsoleWarn;
    console.info = this.originalConsoleInfo;
  }
  
  // Método para procesar logs y filtrar los que son del sistema
  processLog(type, args) {
    if (!this.isCapturing) return;
    
    // Si es un log del sistema, no lo emitimos en absoluto
    if (this.isSystemLog(args)) {
      return;
    }
    
    // Si llegamos aquí, el log es de la lambda y debemos emitirlo
    this.emit(type, args);
  }
  
  // Método para determinar si un log es del sistema
  isSystemLog(args) {
    if (args.length === 0) return false;
    
    // Verificar si cualquiera de los strings en systemLogs está en el primer argumento
    const firstArg = String(args[0]);
    
    // Si el log comienza con [SYSTEM], es un log de sistema y debe ser filtrado
    if (typeof firstArg === 'string' && firstArg.startsWith('[SYSTEM]')) {
      return true;
    }
    
    // Si el log comienza con [LAMBDA], no es del sistema (es un log explícito del usuario)
    if (typeof firstArg === 'string' && firstArg.startsWith('[LAMBDA]')) {
      // Quitamos el prefijo para que se vea más limpio
      args[0] = firstArg.substring('[LAMBDA]'.length).trim();
      return false;
    }
    
    // Si el mensaje proviene de un handler lambda, permitirlo
    if (this.inHandlerCode) {
      return false;
    }
    
    // Verificar contra patrones conocidos de logs del sistema
    for (const systemLogPrefix of this.systemLogs) {
      if (typeof firstArg === 'string' && firstArg.includes(systemLogPrefix)) {
        return true;
      }
    }
    
    // Patrones adicionales basados en análisis de logs
    // Verificar si es un log interno de la librería
    if (
      (typeof firstArg === 'string' && /^\[.*?\]/.test(firstArg) && !firstArg.startsWith('[LAMBDA]')) ||  // Logs con formato [ALGO] que no sea [LAMBDA]
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
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    });

    const message = formattedArgs.join(' ');
    
    this.socket.emit('console', {
      type,
      message,
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

      // Transform paths to be relative to cwd
      const handlersWithRelativePaths = handlers.map(handler => ({
        ...handler,
        path: path.relative(cwd, handler.path).replace(/\\/g, '/') // Convert Windows backslashes to forward slashes
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
        canceled: false
      };

      try {
        socket.emit('execution-start', { sessionId });

        // Mensaje de inicio de ejecución - usando systemLog para que no aparezca en Output
        global.systemLog(`Starting execution of ${path.basename(handlerPath)} -> ${handlerMethod}`);
        
        const startTime = Date.now();
        
        // Allow the execution to be canceled
        if (currentExecutionContext.canceled) {
          throw new Error('Execution canceled by user');
        }
        
        // Mostrar información del evento (usando systemLog)
        global.systemLog(`Event data: ${JSON.stringify(eventData || {}, null, 2)}`);
        
        // Aquí comienza la ejecución real del handler del usuario
        // Marcar que estamos dentro del código del handler
        outputCapture.inHandlerCode = true;
        
        const result = await runHandler(
          handlerPath,
          handlerMethod,
          eventData || {},
          {},
          {
            loadEnv: true,
          }
        );
        
        // Al terminar la ejecución, volvemos a estar en código de librería
        outputCapture.inHandlerCode = false;
        
        const duration = Date.now() - startTime;
        
        // Check if execution was canceled during the run
        if (currentExecutionContext.canceled) {
          throw new Error('Execution canceled by user');
        }

        // Mensaje de finalización exitosa (usando systemLog)
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
          // Mensaje de cancelación
          global.systemLog('Execution was cancelled by user');
          socket.emit('execution-stopped', { sessionId });
        } else {
          // Marcar que estamos de vuelta en código de librería
          outputCapture.inHandlerCode = false;
          
          // Para garantizar que los errores se muestren en el output,
          // enviamos el error directamente al terminal con el formato adecuado
          socket.emit('console', {
            type: 'error',
            message: `Error: ${error.message}`,
            timestamp: new Date().toISOString(),
            sessionId
          });
          
          // Si hay stack trace, enviarlo también
          if (error.stack) {
            socket.emit('console', {
              type: 'error',
              message: error.stack,
              timestamp: new Date().toISOString(),
              sessionId
            });
          }
          
          // Mensaje de error (usando systemLog)
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
          sessionId
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

      if (options.open) {
        open(`http://localhost:${port}`);
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
};
