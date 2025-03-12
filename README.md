# Lambda Running

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> A powerful library for running and testing AWS Lambda functions locally with custom events.

Lambda Running provides a seamless local testing environment for your AWS Lambda functions, allowing you to execute them with custom events, save frequently used events, and iterate quickly during development.

## ✨ Features

- **Interactive Mode** - Run Lambda functions with an intuitive CLI interface
- **Custom Event Support** - Test with your own event payloads
- **Event Management** - Save, load, and reuse event payloads
- **TypeScript Support** - Test both JavaScript and TypeScript Lambda functions
- **Realistic Context** - Simulates AWS Lambda execution context
- **Zero Configuration** - Works with your existing Lambda code

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Interactive Mode](#interactive-mode)
  - [CLI Commands](#cli-commands)
  - [Programmatic API](#programmatic-api)
- [Example](#example)
- [Configuration](#configuration)
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
npm install -g ts-node typescript
```

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

### CLI Commands

Lambda Running provides several CLI commands for different use cases:

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
```

## 📝 Example

Let's say you have a Lambda function that processes user data:

```javascript
// handler.js
exports.processUser = async (event, context) => {
  // Validate the user
  if (!event.userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing userId' })
    };
  }

  // Process the user...
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: 'User processed successfully',
      userId: event.userId,
      context: {
        awsRequestId: context.awsRequestId
      }
    })
  };
};
```

You can test this function interactively:

```bash
lambda-run i
```

Or directly with the CLI:

```bash
lambda-run run handler.js processUser --event '{"userId": "123"}'
```

## ⚙️ Configuration

Lambda Running works out of the box with zero configuration. However, you can configure its behavior through environment variables:

- `LAMBDA_RUNNING_EVENT_DIR`: Custom directory for saved events (default: `~/.lambda-running/events`)
- `LAMBDA_RUNNING_TIMEOUT`: Default timeout in milliseconds (default: `30000`)

## 🤝 Contributing

Contributions, issues and feature requests are welcome. Feel free to check [issues page](https://github.com/yourusername/lambda-running/issues) if you want to contribute.

## 📜 License

This project is [MIT](LICENSE) licensed. 