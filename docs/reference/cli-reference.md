# 🖥️ Lambda Running: CLI Reference

This guide provides a comprehensive reference for all command-line interface (CLI) commands available in Lambda Running.

## 🌐 Global Options

These options apply to most commands:

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--help` | `-h` | Show help information | |
| `--version` | `-v` | Show version information | |
| `--config` | `-c` | Path to config file | `lambda-running.json` |
| `--verbose` | | Enable verbose logging | `false` |
| `--silent` | | Disable all output except errors | `false` |
| `--json` | | Output in JSON format | `false` |

## 📋 Command Summary

| Command | Description |
|---------|-------------|
| `lambda-run <handler>` | Run a Lambda handler |
| `lambda-run ui` | Start the UI server |
| `lambda-run init` | Initialize a new configuration |
| `lambda-run list` | List available handlers |
| `lambda-run save-event` | Save an event for reuse |
| `lambda-run events` | List saved events |
| `lambda-run watch` | Run a handler in watch mode |
| `lambda-run logs` | Display execution logs |
| `lambda-run export` | Export handler for deployment |
| `lambda-run import` | Import event from AWS |

## 🏃‍♂️ Running Lambda Handlers

### Basic Usage

```bash
lambda-run <handler-path> [handler-name]
```

If `handler-name` is omitted, it defaults to `handler`.

### Examples

```bash
# Run the 'handler' function in hello.js
lambda-run hello.js

# Run the 'processOrder' function in orders.js
lambda-run orders.js processOrder

# Run a TypeScript handler
lambda-run src/handler.ts
```

### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--event` | `-e` | Path to event JSON file | `{}` |
| `--inline-event` | `-i` | Inline JSON event data | |
| `--name` | `-n` | Name of saved event to use | |
| `--env-file` | | Path to .env file | `./.env` |
| `--env` | `-v` | Set environment variables | |
| `--timeout` | `-t` | Function timeout (ms) | `30000` |
| `--memory-size` | `-m` | Function memory size (MB) | `128` |
| `--aws-region` | `-r` | AWS region to use | `us-east-1` |
| `--save-result` | | Save execution result to file | |
| `--watch` | `-w` | Watch for file changes | `false` |
| `--debug` | `-d` | Enable Node.js inspector | `false` |

## 💻 UI Server Commands

### Starting the UI Server

```bash
lambda-run ui [options]
```

### UI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port` | Port to listen on | `3000` |
| `--host` | Host to bind to | `localhost` |
| `--no-open` | Don't open browser | `false` |
| `--theme` | UI theme (light/dark/system) | `system` |
| `--base-path` | Base path for UI | `/` |
| `--auth-user` | Basic auth username | |
| `--auth-pass` | Basic auth password | |

## 📁 Event Management

### Saving Events

```bash
lambda-run save-event [options] <event-name>
```

### Event Save Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--event` | `-e` | Path to event JSON file | |
| `--inline-event` | `-i` | Inline JSON event data | |
| `--description` | `-d` | Event description | |
| `--tags` | `-t` | Tags for the event (comma-separated) | |

### Listing Events

```bash
lambda-run events [options]
```

### Event List Options

| Option | Description | Default |
|--------|-------------|---------|
| `--filter` | Filter events by name or tag | |
| `--json` | Output in JSON format | `false` |

## 🔄 Watch Mode

```bash
lambda-run watch <handler-path> [handler-name] [options]
```

### Watch Options

| Option | Description | Default |
|--------|-------------|---------|
| `--watch-dirs` | Directories to watch (comma-separated) | `./` |
| `--ignore` | Glob patterns to ignore | `node_modules` |
| `--delay` | Debounce delay (ms) | `500` |

## 🔎 Handler Discovery

### Listing Available Handlers

```bash
lambda-run list [options]
```

### List Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dirs` | Directories to scan (comma-separated) | `./` |
| `--pattern` | File pattern to match | `**/*.{js,ts}` |
| `--json` | Output in JSON format | `false` |

## 🧩 Configuration Management

### Initializing Configuration

```bash
lambda-run init [options]
```

### Init Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Overwrite existing config | `false` |
| `--minimal` | Create minimal configuration | `false` |
| `--template` | Configuration template to use | `default` |

## 📊 Logs and Monitoring

### Viewing Logs

```bash
lambda-run logs [options]
```

### Log Options

| Option | Description | Default |
|--------|-------------|---------|
| `--id` | Execution ID to show logs for | |
| `--tail` | Number of lines to show | `100` |
| `--filter` | Filter logs by text | |
| `--level` | Minimum log level to show | `info` |

## 🔌 AWS Integration

### Importing Events from AWS

```bash
lambda-run import [options] <event-name>
```

### Import Options

| Option | Description | Default |
|--------|-------------|---------|
| `--type` | Event type (apigateway, s3, etc.) | |
| `--source` | Source in AWS to import from | |
| `--profile` | AWS profile to use | |

### Exporting a Handler for AWS

```bash
lambda-run export <handler-path> [handler-name] [options]
```

### Export Options

| Option | Description | Default |
|--------|-------------|---------|
| `--output` | Output directory | `./dist` |
| `--include-layers` | Include Lambda layers | `false` |
| `--minify` | Minify the output | `false` |
| `--zip` | Create ZIP archive | `false` |

## 🔧 Advanced Commands

### Running with AWS Service Mocks

```bash
lambda-run <handler> --dynamodb-local --s3-local
```

| Option | Description | Default |
|--------|-------------|---------|
| `--dynamodb-local` | Use local DynamoDB endpoint | `http://localhost:8000` |
| `--s3-local` | Use local S3 endpoint | `http://localhost:9000` |
| `--aws-endpoint` | Custom AWS service endpoint | |

### Execution Profiling

```bash
lambda-run <handler> --profile
```

| Option | Description | Default |
|--------|-------------|---------|
| `--profile` | Enable execution profiling | `false` |
| `--profile-output` | File to save profile data | `lambda-profile.cpuprofile` |

### Setting Environment Variables

```bash
lambda-run <handler> -v KEY1=value1 -v KEY2=value2
```

Multiple `-v` flags can be used to set multiple environment variables.

## 📃 Examples by Use Case

### Testing API Gateway Handlers

```bash
# Test with API Gateway event
lambda-run api-handler.js -i '{
  "httpMethod": "GET",
  "path": "/users",
  "queryStringParameters": {"limit": "10"},
  "headers": {"Authorization": "Bearer token"}
}'
```

### Testing with Different Environments

```bash
# Development environment
lambda-run handler.js --env-file .env.dev

# Production simulation
lambda-run handler.js --env-file .env.prod
```

### Debugging a Handler

```bash
# Start with Node.js inspector enabled
lambda-run handler.js --debug

# More verbose logging
lambda-run handler.js --verbose
```

### Continuous Testing with Watch Mode

```bash
# Auto-reload on changes
lambda-run watch handler.js -e event.json
```

### Generating a Deployment Package

```bash
# Export for AWS Lambda deployment
lambda-run export handler.js --zip --include-layers
```

## 🛠️ Environment Variables

Lambda Running respects the following environment variables:

| Environment Variable | Description |
|----------------------|-------------|
| `LAMBDA_RUNNING_CONFIG` | Path to config file |
| `LAMBDA_RUNNING_TIMEOUT` | Default function timeout |
| `LAMBDA_RUNNING_MEMORY_SIZE` | Default function memory size |
| `LAMBDA_RUNNING_AWS_REGION` | Default AWS region |
| `LAMBDA_RUNNING_EVENT_DIR` | Directory for saved events |
| `LAMBDA_RUNNING_UI_PORT` | Default UI server port |
| `LAMBDA_RUNNING_VERBOSE` | Enable verbose logging |

## 🔍 Next Steps

- [Read the Configuration Guide](../features/configuration.md)
- [Explore Advanced Patterns](./advanced-patterns.md)
- [Learn about the UI Mode](../features/ui-mode.md) 