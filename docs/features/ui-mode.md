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

For each handler, you can:
- Run the handler with different events
- Monitor execution time usage
- Access logs and output details

### Event Management

The UI provides a visual way to manage your test events:

Key capabilities include:
- Creating new events with the integrated JSON editor
- Saving frequently used events
- Organizing events with categories

### Real-time Execution

When you run a handler, the UI shows real-time information about the execution:

You can see:
- Execution status
- Execution time
- Logs produced during execution
- Response data

## ⚙️ Configuring the UI

### Port Configuration

By default, the UI runs on port 3000. To change this:

```bash
lambda-run ui --port 8080
```

### Theme Options

The UI supports light and dark themes

## 🔍 Next Steps

- [Learn about Event Management](./event-management.md)
- [Configure Lambda Running](./configuration.md)
- [Explore CLI Commands](../reference/cli-reference.md)
- [Read the Advanced Patterns Guide](../reference/advanced-patterns.md) 