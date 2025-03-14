# Lambda Running

![Version](https://img.shields.io/badge/version-0.1.4-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> A powerful library for running and testing AWS Lambda functions locally with custom events.

Lambda Running provides a seamless local testing environment for your AWS Lambda functions, allowing you to execute them with custom events, save frequently used events, and iterate quickly during development.

## ✨ Features

- **Interactive Mode** - Run Lambda functions with an intuitive CLI interface
- **UI Mode** - Test Lambda functions with a web interface featuring real-time logs and improved error visualization
- **Custom Event Support** - Test with your own event payloads
- **Event Management** - Save, load, and reuse event payloads
- **TypeScript Support** - Test TypeScript Lambda functions using your project's own tsconfig.json, including path aliases (@/\*)
- **Environment Variables** - Automatically loads variables from `.env` files
- **Lambda Focused** - Specifically detects functions named `handler` as per AWS Lambda conventions
- **Realistic Context** - Simulates AWS Lambda execution context
- **Zero Configuration** - Works with your existing Lambda code
- **Smart Scanning** - Ignores node_modules and supports .lambdarunignore for faster execution

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Interactive Mode](#interactive-mode)
  - [UI Mode](#ui-mode)
  - [CLI Commands](#cli-commands)
  - [Programmatic API](#programmatic-api)
- [Configuration](#configuration)
  - [.lambdarunignore](#lambdarunignore)
  - [Environment Variables](#environment-variables)
  - [TypeScript Support](#typescript-support)
- [Example](#example)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

```bash
# Global installation (recommended for CLI usage)
npm install -g lambda-running

# Local installation (for programmatic usage)
npm install lambda-running --save-dev
```

For TypeScript support:

```bash
# Basic TypeScript support
npm install -g ts-node typescript

# For projects using path aliases (@/* imports)
npm install --save-dev tsconfig-paths
```

Lambda Running will automatically use your project's `tsconfig.json` if it exists, including properly resolving path aliases like `@/*` in your imports.

## 💻 Usage

### Interactive Mode

The interactive mode is the highlight feature of Lambda Running. It provides a simple, intuitive interface for testing your Lambda functions without having to write any configuration files.

To start interactive mode:

```bash
lambda-run i
# or
lambda-run interactive
```

Interactive mode will:

1. Scan your current directory for Lambda handler functions
2. Allow you to select a handler to run
3. Provide options for event input (empty, file, manual JSON entry, or saved events)
4. Execute the function and display the results
5. Optionally save events for future use
6. Allow you to test another handler or exit

### UI Mode

UI Mode provides a modern web interface for testing your Lambda functions with enhanced visualization and real-time feedback.

To start UI Mode:

```bash
lambda-run ui
# or with a custom port
lambda-run ui --port 3001
```

UI Mode provides the following benefits:

1. **Visual Interface** - An intuitive web-based UI for executing Lambda functions
2. **Real-time Logs** - See logs and execution results as they happen
3. **Enhanced Error Visualization** - Improved formatting and display of error messages and stack traces
4. **Intelligent Log Filtering** - Automatic separation of system logs from user logs
5. **Auto-scrolling** - Follows execution output in real-time
6. **Exception Highlighting** - Better visibility of exception names and stack traces

The UI server runs locally and opens automatically in your default browser. You can keep it running in the background while you develop and test your Lambda functions.

### CLI Commands

Lambda Running provides several CLI commands for different use cases:

#### Start UI Mode

```bash
lambda-run ui [--port 3000]
```

#### Run a specific handler with an event

```bash
lambda-run run path/to/handler.js handlerMethod --event '{"key": "value"}'
# or with a file
lambda-run run path/to/handler.js handlerMethod --event path/to/event.json
# or with a saved event
lambda-run run path/to/handler.js handlerMethod --event-name myEvent
```

#### Scan for available handlers

```bash
lambda-run scan [directory]
```

#### List saved events

```bash
lambda-run events
```

#### Delete a saved event

```bash
lambda-run delete-event myEvent
```

### Programmatic API

You can also use Lambda Running programmatically in your Node.js applications:

```javascript
const { runHandler, scanForHandlers, saveEvent, getEvents } = require('lambda-running');
const { start: startUI, stop: stopUI } = require('lambda-running/ui');

// Run a handler
async function testHandler() {
  const event = { key: 'value' };
  const result = await runHandler('./path/to/handler.js', 'handlerMethod', event);
  console.log(result);
}

// Scan for handlers
const handlers = scanForHandlers('./src');
console.log(handlers);

// Save and retrieve events
saveEvent('myEvent', { key: 'value' }, 'custom-category');
const events = getEvents();

// Start the UI server programmatically
startUI({ port: 3000, open: true }); // open: true will open the browser automatically
```

## 📝 Example

Let's say you have a Lambda function that processes user data:

```javascript
// handler.js
exports.handler = async (event, context) => {
  // Validate the user
  if (!event.userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing userId' }),
    };
  }

  // Process the user...
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'User processed successfully',
      userId: event.userId,
      context: {
        awsRequestId: context.awsRequestId,
      },
    }),
  };
};
```

You can test this function interactively:

```bash
lambda-run i
```

Or with the UI Mode for enhanced visualization:

```bash
lambda-run ui
```

Or directly with the CLI:

```bash
lambda-run run handler.js handler --event '{"userId": "123"}'
```

**Note:** Lambda Running specifically looks for functions named `handler` to align with AWS Lambda conventions.

## ⚙️ Configuration

Lambda Running works out of the box with zero configuration. However, you can customize its behavior in several ways:

### Environment Variables

Lambda Running supports two types of environment variables:

1. **Configuration Variables** - Control the behavior of the Lambda Running tool:

   - `LAMBDA_RUNNING_EVENT_DIR`: Custom directory for saved events (default: `~/.lambda-running/events`)
   - `LAMBDA_RUNNING_TIMEOUT`: Default timeout in milliseconds (default: `30000`)
   - `LAMBDA_RUNNING_UI_PORT`: Default port for the UI server (default: `3000`)
   - `LAMBDA_RUNNING_UI_OPEN`: Whether to automatically open the UI in browser (default: `true`)

2. **Function Variables** - Variables passed to your Lambda function from `.env` files:
   - Lambda Running automatically loads variables from a `.env` file in your project root
   - These variables are made available to your Lambda function through `process.env`
   - For more information, see the [environment variables documentation](./docs/environment-variables.md)

### .lambdarunignore

You can create a `.lambdarunignore` file in your project root to exclude directories and files from handler scanning:

```
# Comments start with #
dist
coverage
.git
*.test.js
```

By default, `node_modules` is always excluded. For more information, see the [.lambdarunignore documentation](./docs/lambdarunignore.md).

### TypeScript Support

Lambda Running automatically detects and uses your project's TypeScript configuration:

- Uses your project's `tsconfig.json` if available
- Falls back to reasonable defaults if no configuration is found
- Supports TypeScript handler files (.ts) directly without compilation

For more information, see the [TypeScript support documentation](./docs/typescript.md).

## 🤝 Contributing

Contributions, issues and feature requests are welcome. Feel free to check [issues page](https://github.com/yourusername/lambda-running/issues) if you want to contribute.

## 📜 License

This project is [MIT](LICENSE) licensed.
