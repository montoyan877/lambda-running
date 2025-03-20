# 📖 Lambda Running: API Reference

This document provides a complete reference for Lambda Running's programmatic API.

## 📋 Core API

The main module exports the following functions:

```javascript
const { 
  runHandler,      // Run a Lambda handler
  scanForHandlers, // Find Lambda handlers
  saveEvent,       // Save an event
  getEvents,       // Get all saved events
  getEvent,        // Get a specific event
  deleteEvent      // Delete an event
} = require('lambda-running');
```

The UI server module is available as a submodule:

```javascript
const { start, stop } = require('lambda-running/ui');
```

## 🧪 Handler Management

### Running a Handler

```javascript
/**
 * Run a Lambda handler with the provided event
 * 
 * @param {string} handlerPath - Path to the handler file
 * @param {string} handlerMethod - Method name to call in the handler file
 * @param {Object} event - Event object to pass to the handler
 * @param {Object} [context={}] - Lambda context object
 * @param {Object} [options={}] - Additional options
 * @param {boolean} [options.loadEnv=true] - Whether to load environment variables
 * @returns {Promise<any>} - Result from the Lambda handler
 */
async function runHandler(handlerPath, handlerMethod, event, context = {}, options = {}) {
  // ...
}
```

#### Example

```javascript
const { runHandler } = require('lambda-running');

// Simple usage
const result = await runHandler('./src/handler.js', 'handler', { key: 'value' });

// With custom context
const result = await runHandler(
  './src/handler.js', 
  'handler', 
  { key: 'value' },
  { 
    awsRequestId: 'test-123',
    functionName: 'my-test-function'
  }
);

// Disable environment variable loading
const result = await runHandler(
  './src/handler.js', 
  'handler', 
  { key: 'value' },
  {},
  { loadEnv: false }
);
```

### Scanning for Handlers

```javascript
/**
 * Scan a directory for potential Lambda handlers
 * 
 * @param {string} directory - Directory to scan
 * @param {Array<string>} [extensions=['.js', '.ts']] - File extensions to include
 * @param {Object} [options={}] - Additional options
 * @param {boolean} [options.ignoreNodeModules=true] - Whether to ignore node_modules
 * @param {boolean} [options.useIgnoreFile=true] - Whether to use .lambdarunignore file
 * @returns {Array<Object>} - Array of handler objects with path and methods
 */
function scanForHandlers(directory, extensions = ['.js', '.ts'], options = {}) {
  // ...
}
```

#### Example

```javascript
const { scanForHandlers } = require('lambda-running');

// Basic usage
const handlers = scanForHandlers('./src');

// Custom extensions
const jsHandlers = scanForHandlers('./src', ['.js']);

// Include node_modules (not recommended)
const allHandlers = scanForHandlers('./src', ['.js', '.ts'], {
  ignoreNodeModules: false
});

// Ignore the .lambdarunignore file
const noIgnoreHandlers = scanForHandlers('./src', ['.js', '.ts'], {
  useIgnoreFile: false
});
```

#### Return Value

The function returns an array of handler objects:

```javascript
[
  {
    path: '/absolute/path/to/handler.js',
    methods: ['handler', 'otherExportedFunction'],
    // Additional metadata about the handler
  }
]
```

## 🗂️ Event Management

### Saving Events

```javascript
/**
 * Save an event to the event store
 * 
 * @param {string} name - Name for the event
 * @param {Object} event - Event data
 * @param {string} [category='default'] - Category for organization
 * @returns {Object} - Saved event info
 */
function saveEvent(name, event, category = 'default') {
  // ...
}
```

#### Example

```javascript
const { saveEvent } = require('lambda-running');

// Save an event to the default category
saveEvent('myEvent', { key: 'value' });

// Save an event to a custom category
saveEvent('apiEvent', { 
  httpMethod: 'GET',
  path: '/users' 
}, 'api');
```

### Getting All Events

```javascript
/**
 * Get all saved events
 * 
 * @param {boolean} [includeEventData=false] - Whether to include event data
 * @param {string} [category=null] - Filter by category (null for all categories)
 * @returns {Array<Object>} - Array of event objects
 */
function getEvents(includeEventData = false, category = null) {
  // ...
}
```

#### Example

```javascript
const { getEvents } = require('lambda-running');

// Get event metadata only
const eventList = getEvents();

// Get events with data
const eventsWithData = getEvents(true);

// Get events from a specific category
const apiEvents = getEvents(true, 'api');
```

### Getting a Specific Event

```javascript
/**
 * Get a specific event by name
 * 
 * @param {string} name - Name of the event
 * @param {string} [category='default'] - Category of the event
 * @returns {Object|null} - Event data or null if not found
 */
function getEvent(name, category = 'default') {
  // ...
}
```

#### Example

```javascript
const { getEvent } = require('lambda-running');

// Get event from default category
const event = getEvent('myEvent');

// Get event from specific category
const apiEvent = getEvent('apiEvent', 'api');

// Access event data
if (event) {
  console.log(event.data);
  console.log(event.timestamp);
}
```

### Deleting an Event

```javascript
/**
 * Delete an event from the store
 * 
 * @param {string} name - Name of the event
 * @param {string} [category='default'] - Category of the event
 * @returns {boolean} - Whether the deletion was successful
 */
function deleteEvent(name, category = 'default') {
  // ...
}
```

#### Example

```javascript
const { deleteEvent } = require('lambda-running');

// Delete from default category
const deleted = deleteEvent('myEvent');

// Delete from specific category
const apiDeleted = deleteEvent('apiEvent', 'api');
```

## 🖥️ UI Server

### Starting the UI Server

```javascript
/**
 * Start the UI server
 * 
 * @param {Object} [options={}] - Server options
 * @param {number} [options.port=3000] - Port to run on
 * @param {boolean} [options.open=true] - Whether to open browser
 * @param {string} [options.cwd=process.cwd()] - Current working directory
 * @param {boolean} [options.developmentMode=true] - Development mode
 * @returns {Promise<void>}
 */
async function start(options = {}) {
  // ...
}
```

#### Example

```javascript
const { start } = require('lambda-running/ui');

// Start with default options
await start();

// Custom port and don't open browser
await start({
  port: 8080,
  open: false,
  cwd: './my-project',
  developmentMode: false
});
```

### Stopping the UI Server

```javascript
/**
 * Stop the UI server
 * 
 * @returns {Promise<void>}
 */
async function stop() {
  // ...
}
```

#### Example

```javascript
const { start, stop } = require('lambda-running/ui');

// Start server
await start();

// Do something...

// Stop server
await stop();
```

## 🌐 REST API Endpoints

When running the UI server, the following REST API endpoints are available:

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/api/healthcheck` | GET | Check server status | None |
| `/api/handlers` | GET | List all handlers | None |
| `/api/run` | POST | Run a handler | `handlerPath`, `handlerMethod`, `event` |
| `/api/events` | GET | Get all events | `includeData`, `category` |
| `/api/events` | POST | Save an event | `name`, `event`, `category` |
| `/api/events/:name` | GET | Get a specific event | `name` (in URL), `category` (query) |
| `/api/events/:name` | DELETE | Delete an event | `name` (in URL), `category` (query) |

### Example API Usage

```javascript
// Run a handler
fetch('http://localhost:3000/api/run', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    handlerPath: './src/handler.js',
    handlerMethod: 'handler',
    event: { userId: '123' }
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Save an event
fetch('http://localhost:3000/api/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'testEvent',
    category: 'api',
    event: { path: '/users' }
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 📢 WebSocket Events

The UI server uses Socket.IO for real-time communication. The following events are available:

| Event | Description | Data |
|-------|-------------|------|
| `log` | Log message from execution | `{ type, message }` |
| `result` | Final result | `{ result, success }` |
| `error` | Execution error | `{ error, stack }` |
| `execution-start` | Execution started | `{ handlerPath, handlerMethod }` |
| `execution-end` | Execution completed | `{ duration }` |

### Example WebSocket Usage

```javascript
const socket = io('http://localhost:3000');

// Listen for logs
socket.on('log', (data) => {
  console.log(`[${data.type}] ${data.message}`);
});

// Listen for results
socket.on('result', (data) => {
  console.log('Result:', data.result);
});

// Listen for errors
socket.on('error', (data) => {
  console.error('Error:', data.error);
});
```

## 🔧 Lambda Context

When running a handler, Lambda Running simulates the AWS Lambda context object. The default context includes:

```javascript
{
  awsRequestId: `lambda-test-${Date.now()}`,
  functionName: `local-${path.basename(handlerPath)}`,
  functionVersion: 'local',
  memoryLimitInMB: '128',
  getRemainingTimeInMillis: () => 30000, // 30 seconds
}
```

You can override these values by providing a custom context object to `runHandler`. 

// Configuration object structure
interface LambdaRunningConfig {
  // Layer configuration
  layers?: string[];                  // Simple array of layer names
  layerMappings?: {                   // Map of lambda layer paths to local paths
    [layerPath: string]: string;      // e.g. "/opt/nodejs/my-lib": "./layers/my-lib"
  };
  
  // Environment variables
  envFiles?: string[];                // Array of env files to load (e.g. [".env", ".env.local"])
  
  // Handler discovery
  ignorePatterns?: string[];          // Glob patterns to ignore when scanning for handlers
  ignoreLayerFilesOnScan?: boolean;   // Whether to ignore files in layers dir during scan
  
  // Debug settings
  debug?: boolean;                    // Enable debug mode for verbose logging
} 