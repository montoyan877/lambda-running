# 🖥️ Lambda Running: CLI Reference

This guide provides a reference for the command-line interface (CLI) commands available in Lambda Running.

## 🌐 Global Options

These options apply to most commands:

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help information | |
| `--version` | `-v` | Show version information | |

## 📋 Command Summary

| Command | Description |
|---------|-------------|
| `lambda-run run <handler-path> <handler-method>` | Run a Lambda handler |
| `lambda-run scan [directory]` | Scan for Lambda handlers |
| `lambda-run events` | List saved events |
| `lambda-run delete-event <name>` | Delete a saved event |
| `lambda-run interactive` | Launch interactive mode |
| `lambda-run ui` | Start the UI server |
| `lambda-run init` | Initialize configuration files |

## 🏃‍♂️ Running Lambda Handlers

### Basic Usage

```bash
lambda-run run <handler-path> <handler-method> [options]
```

### Examples

```bash
# Run the 'handler' function in hello.js
lambda-run run hello.js handler

# Run the 'processOrder' function in orders.js
lambda-run run orders.js processOrder -e event.json
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--event` | `-e` | JSON string or path to event file | `{}` |
| `--event-name` | `-n` | Name of saved event to use | |
| `--category` | `-c` | Category of saved event | `default` |
| `--save` | `-s` | Save the event for future use | |
| `--no-env` | | Do not load environment variables | `false` |

## 🔍 Handler Discovery

### Scanning for Handlers

```bash
lambda-run scan [directory] [options]
```

The `scan` command searches for potential Lambda handlers in the specified directory.

### Scan Options

| Option | Description | Default |
|--------|-------------|---------|
| `--extensions` | File extensions to include | `.js,.ts` |
| `--include-node-modules` | Include node_modules directory | `false` |
| `--no-ignore-file` | Ignore the .lambdarunignore file | `false` |

## 📁 Event Management

### Listing Events

```bash
lambda-run events [options]
```

### Event List Options

| Option | Description | Default |
|--------|-------------|---------|
| `--category` | Filter events by category | |

### Deleting Events

```bash
lambda-run delete-event <name> [options]
```

### Delete Event Options

| Option | Description | Default |
|--------|-------------|---------|
| `--category` | Category of the event | `default` |

## 💻 Interactive Mode

```bash
lambda-run interactive
```

Or use the alias:

```bash
lambda-run i
```

Interactive mode provides a guided interface to:
- Select a handler from those available in your project
- Choose or create an event
- Run the handler with the selected event
- View the execution results
- Save events for future use

## 🖥️ UI Mode

```bash
lambda-run ui [options]
```

### UI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port` | Port to listen on | `3000` |
| `--no-open` | Don't open browser | `false` |

## 🧩 Configuration Management

### Initializing Configuration

```bash
lambda-run init [options]
```

### Init Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Overwrite existing files | `false` |

The `init` command creates two files:
- `lambda-running.json` - Configuration file for Lambda Running
- `.lambdarunignore` - Patterns for files to ignore when scanning for handlers

Example usage:
```bash
# Create initial configuration files
lambda-run init

# Overwrite existing files
lambda-run init --force
```

## 📃 Examples by Use Case

### Testing API Gateway Handlers

```bash
# Test with an API Gateway event from a file
lambda-run run api-handler.js handler -e api-event.json

# Save the event for future use
lambda-run run api-handler.js handler -e api-event.json -s api-get-request
```

### Testing with Environment Variables

```bash
# Run with environment variables from .env file (default)
lambda-run run handler.js handler

# Run without loading environment variables
lambda-run run handler.js handler --no-env
```

### Using Interactive Mode

```bash
# Start interactive handler selection
lambda-run interactive
```

### Using the UI

```bash
# Start the web UI on the default port
lambda-run ui

# Start on a custom port
lambda-run ui --port 8080
```

## 🔍 Next Steps

- [Read the Configuration Guide](../features/configuration.md)
- [Explore Advanced Patterns](./advanced-patterns.md) 