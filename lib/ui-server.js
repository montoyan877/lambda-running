/**
 * Lambda Running UI Server
 * Provides a web interface for testing AWS Lambda functions
 */

const express = require('express');
const http = require('http');
const {
  Server
} = require('socket.io');
const open = require('open');
const cors = require('cors');
const chalk = require('chalk');
const {
  scanForHandlers,
  runHandler
} = require('./lambda-runner');
const {
  saveEvent,
  getEvents,
  getEvent,
  deleteEvent
} = require('./event-store');
const path = require('path');

// Create an Express application
const app = express();
let server;
let io;

// Store running state
let isRunning = false;
let port = 3000;

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

    // Flag para marcar cuando estamos en modo captura
    this.isCapturing = false;

    // Flag para identificar si estamos en código de handler o librería
    this.inHandlerCode = false;

    // Lista de logs del sistema que deberíamos ignorar
    this.systemLogs = ['Starting execution of handler:', 'Loading environment variables from', 'Execution started', 'Execution completed', 'Handler returned result:', 'Auth token refreshed', 'Using TypeScript configuration', 'Executing handler', 'Socket connected', 'Socket disconnected', 'Client connected to UI', 'Client disconnected from UI', 'Lambda Running UI server', 'UI server is already running', 'transpileOnly', 'require.resolve', 'ts-node', 'tsconfig', 'Event data:', 'Execution completed in', 'Starting execution of', 'Error details:', 'Error:', 'Starting lambda-running', 'Could not open browser', 'UI available at', 'Scanned for handlers', 'Ignoring file', 'Processing file', 'Import resolver', 'AWS SDK', 'Lambda Running'];
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

    // Verificar si el primer argumento es un objeto Error (incluyendo excepciones como AuthenticationException)
    if (args.length > 0 && args[0] instanceof Error) {
      const error = args[0];
      // Obtenemos el nombre real de la clase de error usando constructor.name que es más fiable
      const errorName = error.constructor.name || error.name || 'Error';

      // Emitir el nombre de la excepción con formato especial
      this.emit('error', [`${errorName} [Error]`]);

      // Emitir el stack trace sin la primera línea (que contiene el nombre y mensaje)
      if (error.stack) {
        const stackLines = error.stack.split('\n');
        // Solo emitir las líneas del stack sin la primera que ya contiene el error
        if (stackLines.length > 1) {
          this.emit('error', [stackLines.slice(1).join('\n')]);
        }
      } else if (error.message) {
        this.emit('error', [error.message]);
      }
      return;
    }

    // Capturas específicas para errores y excepciones - debemos asegurarnos de mostrarlos siempre
    if (type === 'error' && args.length > 0) {
      // Si el primer argumento es una cadena que contiene un error específico o stack trace,
      // asegurarnos de mostrarlo incluso si contiene patrones de sistema
      const firstArg = String(args[0]);

      // Detectar patrones específicos de errores y excepciones
      if (firstArg.includes('Error') || firstArg.includes('Exception') || firstArg.includes('at ') ||
      // Líneas de stack trace
      firstArg.includes('Failed') || firstArg.includes('Uncaught') || /^\s+at\s/.test(firstArg)) {
        // Líneas de stack trace con indentación
        this.emit('error', args);
        return;
      }
    }

    // Si llegamos aquí, el log es de la lambda y debemos emitirlo
    this.emit(type, args);
  }

  // Método para determinar si un log es del sistema
  isSystemLog(args) {
    if (args.length === 0) return false;

    // Si el primer argumento es un Error, NUNCA debe ser considerado un log del sistema
    if (args[0] instanceof Error) {
      return false;
    }

    // Obtener el primer argumento como string para evaluarlo
    const firstArg = String(args[0]);

    // Si el log comienza con [SYSTEM], es un log de sistema y debe ser filtrado
    if (typeof firstArg === 'string' && firstArg.startsWith('[SYSTEM]')) {
      return true;
    }

    // Los errores y excepciones nunca deben ser considerados logs del sistema
    if (typeof firstArg === 'string' && (firstArg.includes('Error') || firstArg.includes('Exception') || firstArg.includes('at ') ||
    // Para detectar líneas de stack trace
    /^\s+at\s/.test(firstArg))) {
      // Para detectar líneas de stack trace con indentación
      return false;
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
    if (typeof firstArg === 'string' && /^\[.*?\]/.test(firstArg) && !firstArg.startsWith('[LAMBDA]') ||
    // Logs con formato [ALGO] que no sea [LAMBDA]
    firstArg.includes('lambda-running') || firstArg.includes('Lambda Running') || firstArg.includes('node_modules') || firstArg.includes('Starting') || firstArg.includes('Importing') || firstArg.includes('Loading')) {
      return true;
    }
    return false;
  }
  emit(type, args) {
    // Format and emit log messages to the client
    const formattedArgs = args.map(arg => {
      // No intentar JSON.stringify en objetos Error
      if (typeof arg === 'object' && arg !== null && !(arg instanceof Error)) {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }

      // Convertir a string preservando el formato original
      return String(arg);
    });

    // Combinar argumentos en un mensaje
    let message = formattedArgs.join(' ');

    // Eliminar TODOS los timestamps en CUALQUIER formato
    message = message.replace(/\[\d{2}:\d{2}:\d{2}\]\s*/g, ''); // [HH:MM:SS]
    message = message.replace(/\d{2}:\d{2}:\d{2}\s*/g, ''); // HH:MM:SS sin corchetes
    message = message.replace(/^\s*Error\s*$/i, ''); // Solo la palabra "Error" sola

    // Si después de limpiar el mensaje queda vacío, no enviarlo
    if (!message.trim()) {
      return;
    }

    // Detectar si es un mensaje de excepción para aplicar formato especial
    let errorClass = '';

    // Detectar diferentes tipos de mensajes de error
    if (type === 'error') {
      // Encontrar el tipo de mensaje de error
      if (message.includes('[Error]')) {
        // Es una línea con el nombre de la excepción
        errorClass = 'error-message-heading';
      } else if (message.trim().startsWith('at ') || /^\s+at\s/.test(message)) {
        // Es una línea de stack trace
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
      sessionId: this.sessionId
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
          /* Estilos para mensajes de error */
          .error-message {
            color: #ff5252;
            font-weight: bold;
            white-space: pre-wrap;
            font-family: monospace;
            text-align: left;
            padding: 10px;
            background-color: rgba(255, 0, 0, 0.05);
            border-left: 4px solid #ff5252;
            margin: 8px 0;
            overflow-x: auto;
            display: block;
            width: calc(100% - 20px);
          }
          
          /* Enfatizar la línea con el nombre de la excepción */
          .error-message-heading {
            color: #ff3333;
            font-size: 1.2em;
            font-weight: bold;
            font-family: monospace;
            background-color: rgba(255, 0, 0, 0.1);
            padding: 12px 10px;
            margin: 15px 0 0 0;
            border-left: 4px solid #ff3333;
            border-top-left-radius: 3px;
            border-top-right-radius: 3px;
            text-align: left;
            display: block;
          }
          
          /* Stack trace con formato adecuado */
          .stack-trace {
            white-space: pre;
            font-family: monospace;
            color: #ff7777;
            margin: 0;
            padding: 5px 10px 5px 20px;
            font-size: 0.9em;
            background-color: rgba(255, 0, 0, 0.03);
            border-left: 4px solid rgba(255, 82, 82, 0.5);
            text-align: left;
            display: block;
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
          
          // Contenedor principal para los mensajes
          let outputContainer;
          
          socket.onopen = () => {
            console.log('Connected to server');
            const loadingElement = document.querySelector('.loading');
            loadingElement.textContent = 'Connected to server! Full UI coming soon.';
            
            // Crear un contenedor específico para la salida
            outputContainer = document.createElement('div');
            outputContainer.className = 'output-container';
            outputContainer.style.cssText = 'width: 100%; max-width: 900px; text-align: left; margin-top: 20px; padding: 10px; background-color: #2d2d2d; border-radius: 4px; overflow: auto; max-height: 70vh;';
            loadingElement.parentNode.insertBefore(outputContainer, loadingElement.nextSibling);
            
            // Escuchar eventos de consola
            socket.addEventListener('message', (event) => {
              try {
                const data = JSON.parse(event.data);
                
                // Procesar eventos de consola
                if (data.type === 'console') {
                  const consoleData = data.data;
                  
                  // Eliminar cualquier timestamp que pueda tener el mensaje
                  let message = consoleData.message;
                  message = message.replace(/\[\d{2}:\d{2}:\d{2}\]\s*/g, '');    // [HH:MM:SS]
                  message = message.replace(/\d{2}:\d{2}:\d{2}\s*/g, '');        // HH:MM:SS sin corchetes
                  message = message.replace(/^\s*Error\s*$/i, '');               // Solo la palabra "Error" sola
                  
                  // Si después de limpiar el mensaje queda vacío, ignorarlo
                  if (!message.trim()) return;
                  
                  // Crear elemento de mensaje
                  const messageEl = document.createElement('div');
                  
                  // Aplicar la clase CSS específica si viene del servidor
                  if (consoleData.errorClass) {
                    messageEl.className = consoleData.errorClass;
                  } 
                  // O determinar el tipo de mensaje basado en su contenido
                  else if (consoleData.type === 'error') {
                    // Por defecto, todo mensaje de error tiene la clase base
                    messageEl.className = 'error-message';
                    
                    // Detectar tipos específicos de errores
                    if (message.includes('[Error]') || 
                        /^[A-Z][a-zA-Z]+Exception/.test(message)) {
                      // Es una línea con el nombre de la excepción
                      messageEl.className = 'error-message-heading';
                    } 
                    else if (message.trim().startsWith('at ') || 
                            /^\s+at\s/.test(message) ||
                            (message.includes('.ts:') && message.includes(':')) ||
                            (message.includes('.js:') && message.includes(':'))) {
                      // Es una línea de stack trace
                      messageEl.className = 'stack-trace';
                    }
                  }
                  
                  // Establecer el texto del mensaje
                  messageEl.textContent = message;
                  
                  // Añadir al contenedor
                  outputContainer.appendChild(messageEl);
                  
                  // Auto-scroll hasta el último mensaje
                  outputContainer.scrollTop = outputContainer.scrollHeight;
                }
              } catch (e) {
                console.error('Error parsing message:', e);
              }
            });
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
        useIgnoreFile: true
      });

      // Transform paths to be relative to cwd
      const handlersWithRelativePaths = handlers.map(handler => ({
        ...handler,
        path: path.relative(cwd, handler.path).replace(/\\/g, '/') // Convert Windows backslashes to forward slashes
      }));
      res.json({
        handlers: handlersWithRelativePaths
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to scan for handlers',
        message: error.message
      });
    }
  });

  // Get all saved events
  app.get('/api/events', (req, res) => {
    try {
      const events = getEvents(req.query.category || null);
      res.json({
        events
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get events',
        message: error.message
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
          message: `Event '${req.params.name}' not found`
        });
      }
      res.json({
        event
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get event',
        message: error.message
      });
    }
  });

  // Save an event
  app.post('/api/events', (req, res) => {
    try {
      const {
        name,
        data,
        category = 'default'
      } = req.body;
      if (!name) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Event name is required'
        });
      }
      if (!data) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Event data is required'
        });
      }
      saveEvent(name, data, category);
      res.json({
        success: true,
        message: `Event '${name}' saved successfully`
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to save event',
        message: error.message
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
          message: `Event '${req.params.name}' not found`
        });
      }
      res.json({
        success: true,
        message: `Event '${req.params.name}' deleted successfully`
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to delete event',
        message: error.message
      });
    }
  });

  // Run a Lambda handler
  app.post('/api/run', (req, res) => {
    try {
      const {
        handlerPath,
        handlerMethod
      } = req.body;
      if (!handlerPath || !handlerMethod) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Handler path and method are required'
        });
      }

      // This endpoint only initiates the execution
      // The actual execution and results are handled via WebSockets
      res.json({
        success: true,
        message: 'Execution initiated',
        sessionId: req.body.sessionId || Date.now().toString()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to initiate handler execution',
        message: error.message
      });
    }
  });

  // Create HTTP server and Socket.io instance
  server = http.createServer(app);
  io = new Server(server);

  // Socket.io connection handling
  io.on('connection', socket => {
    global.systemLog('Client connected to UI');

    // Store the current execution context to allow cancellation
    let currentExecutionContext = null;

    // Handler execution
    socket.on('run-handler', async data => {
      const {
        handlerPath,
        handlerMethod,
        eventData,
        sessionId
      } = data;

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
        socket.emit('execution-start', {
          sessionId
        });

        // Display event information (using systemLog)
        global.systemLog(`Event data: ${JSON.stringify(eventData || {}, null, 2)}`);

        // Here begins the actual execution of the user's handler
        // Mark that we are inside the handler code
        outputCapture.inHandlerCode = true;

        // Define startTime to measure execution duration
        const startTime = Date.now();
        let result;
        try {
          result = await runHandler(handlerPath, handlerMethod, eventData || {}, {}, {
            loadEnv: true
          });
        } catch (handlerError) {
          // Explicitly catch the handler error and process it
          // If it's an Error object, show all its details
          if (handlerError instanceof Error) {
            console.log(`ERROR: ${handlerError.name || 'Error'}: ${handlerError.message}`);

            // Show all enumerable properties of the error
            const errorProps = Object.keys(handlerError).filter(key => key !== 'name' && key !== 'message' && key !== 'stack').reduce((obj, key) => {
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
          sessionId
        });
      } catch (error) {
        // Check if this was a cancellation
        if (currentExecutionContext && currentExecutionContext.canceled) {
          // Cancellation message
          global.systemLog('Execution was cancelled by user');
          socket.emit('execution-stopped', {
            sessionId
          });
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
            sessionId
          });

          // If there is a stack trace, send it also
          if (error.stack) {
            socket.emit('console', {
              type: 'error',
              message: error.stack,
              errorClass: 'error-message',
              timestamp: new Date().toISOString(),
              sessionId
            });
          }

          // If it's a specific error like AuthenticationException, ensure it's captured
          if (error.name && error.name !== 'Error') {
            socket.emit('console', {
              type: 'error',
              message: `Exception: ${error.name}: ${error.message}`,
              errorClass: 'error-message',
              timestamp: new Date().toISOString(),
              sessionId
            });
          }

          // Error message (using systemLog)
          global.systemLog(`Execution failed: ${error.message}`);
          socket.emit('execution-result', {
            success: false,
            error: {
              message: error.message,
              stack: error.stack
            },
            sessionId
          });
        }
      } finally {
        outputCapture.stop();
        socket.emit('execution-end', {
          sessionId
        });
        currentExecutionContext = null;
      }
    });

    // Handle stop execution request
    socket.on('stop-execution', data => {
      const {
        sessionId
      } = data;

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
        socket.emit('execution-stopped', {
          sessionId
        });
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
    server.on('error', error => {
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
  return new Promise(resolve => {
    server.close(() => {
      isRunning = false;
      global.systemLog('Lambda Running UI server stopped');
      resolve();
    });
  });
}
module.exports = {
  start,
  stop
};