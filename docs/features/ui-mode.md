# 🖥️ Lambda Running: UI Mode

Lambda Running includes a powerful web-based user interface that makes it easier to test and debug your Lambda functions visually.

## 🚀 Getting Started with UI Mode

To start the UI server, run:

```bash
lambda-run ui
```

This will start a web server (default port 3000) and open your default browser to the Lambda Running UI. If you don't want the browser to open automatically, use:

```bash
lambda-run ui --no-open
```

## 🧩 UI Features Overview

### Handler Management

The Lambda Running UI displays all available Lambda handlers in your project. Handlers are automatically discovered from directories specified in your configuration.

![Handler List](../images/ui-handlers.png)

For each handler, you can:
- Run the handler with different events
- View execution history
- Monitor execution time and memory usage
- Access logs and output details

### Event Management

The UI provides a visual way to manage your test events:

![Event Management](../images/ui-events.png)

Key capabilities include:
- Creating new events with the integrated JSON editor
- Importing events from files
- Saving frequently used events
- Organizing events with tags and categories

### Real-time Execution

When you run a handler, the UI shows real-time information about the execution:

![Real-time Execution](../images/ui-execution.png)

You can see:
- Execution status (pending, running, completed, failed)
- Execution time
- Memory usage
- Logs produced during execution
- Response data

### Debug Tools

The UI includes several tools to help debug your Lambda functions:

![Debug Tools](../images/ui-debug.png)

Features include:
- Log viewer with filtering and search
- Environment variable inspector
- AWS SDK call tracing
- Memory and execution time monitoring

## ⚙️ Configuring the UI

### Port Configuration

By default, the UI runs on port 3000. To change this:

```bash
lambda-run ui --port 8080
```

Or in your `lambda-running.json`:

```json
{
  "ui": {
    "port": 8080
  }
}
```

### Theme Options

The UI supports light and dark themes:

```bash
lambda-run ui --theme dark
```

Or in your `lambda-running.json`:

```json
{
  "ui": {
    "theme": "dark"  // "light", "dark", or "system" (default)
  }
}
```

### Custom Base Path

If you're serving the UI behind a proxy with a base path:

```bash
lambda-run ui --base-path /lambda
```

Or in your `lambda-running.json`:

```json
{
  "ui": {
    "basePath": "/lambda"
  }
}
```

## 🔗 Embedding the UI

You can embed the Lambda Running UI in your own Express application:

```javascript
const express = require('express');
const { createUIRouter } = require('lambda-running/ui');

const app = express();

// Mount Lambda Running UI at /lambda-ui
app.use('/lambda-ui', createUIRouter({
  // Options here
}));

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 🔒 Security Considerations

The Lambda Running UI gives access to:
- Run Lambda functions
- View environment variables
- Access to file system (for saved events)

For security reasons:
- Only use the UI in development environments
- Don't expose the UI on public networks
- Consider using authentication if deploying in shared environments

To add basic authentication:

```bash
lambda-run ui --auth-user admin --auth-pass password
```

Or in your `lambda-running.json`:

```json
{
  "ui": {
    "auth": {
      "username": "admin",
      "password": "password"
    }
  }
}
```

## 🌐 Remote Access

To access the UI from other devices on your network:

```bash
lambda-run ui --host 0.0.0.0
```

This binds the server to all network interfaces instead of just localhost.

## 📱 Mobile View

The Lambda Running UI is responsive and works on mobile devices, allowing you to test your functions from your phone or tablet.

![Mobile View](../images/ui-mobile.png)

## 🔍 Next Steps

- [Learn about Event Management](./event-management.md)
- [Configure Lambda Running](./configuration.md)
- [Explore CLI Commands](../reference/cli-reference.md)
- [Read the Advanced Patterns Guide](../reference/advanced-patterns.md) 