# ⚙️ Lambda Running: Configuration Guide

This guide explains how to configure Lambda Running to customize its behavior for your specific needs.

## 🔧 Configuration File

Lambda Running uses a JSON configuration file (`lambda-running.json`) to customize its behavior. This file can be placed in your project root directory or specified using the `--config` option.

### Creating a Configuration File

To create a default configuration file, run:

```bash
lambda-run init
```

This creates a `lambda-running.json` file in the current directory with default settings.

### Example Configuration

Here's a complete example of a `lambda-running.json` file:

```json
{
  "handlerDirs": ["./src/handlers", "./src/functions"],
  "eventDir": "./.lambda-running/events",
  "timeout": 10000,
  "memorySize": 512,
  "environment": {
    "STAGE": "dev",
    "LOG_LEVEL": "debug"
  },
  "awsRegion": "us-east-1",
  "layers": [
    "./layers/nodejs",
    "./layers/custom"
  ],
  "ui": {
    "port": 3000,
    "open": true,
    "theme": "dark"
  },
  "ignore": [
    "**/*.test.js",
    "**/node_modules/**"
  ],
  "watchDirs": [
    "./src"
  ],
  "envFile": "./.env.development",
  "mockServices": {
    "dynamodb": {
      "endpoint": "http://localhost:8000"
    }
  }
}
```

## 🎚️ Configuration Options

### Core Settings

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `handlerDirs` | Array | Directories to scan for Lambda handlers | `["./"]` |
| `eventDir` | String | Directory to store saved events | `./.lambda-running/events` |
| `timeout` | Number | Function timeout in milliseconds | `30000` (30 seconds) |
| `memorySize` | Number | Simulated memory size in MB | `128` |
| `awsRegion` | String | AWS region to use for AWS SDK | `us-east-1` |
| `environment` | Object | Environment variables to set when running functions | `{}` |
| `layers` | Array | Paths to Lambda Layers | `[]` |
| `ignore` | Array | Glob patterns for files to ignore | `["**/node_modules/**"]` |
| `envFile` | String | Path to env file to load | `./.env` |

### UI Server Settings

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `ui.port` | Number | Port for the UI server | `3000` |
| `ui.open` | Boolean | Auto-open browser when UI starts | `true` |
| `ui.theme` | String | UI theme (`light` or `dark`) | `system` |
| `ui.historySize` | Number | Number of executions to keep in history | `50` |

### Advanced Settings

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `watchDirs` | Array | Directories to watch for changes in watch mode | `["./"]` |
| `mockServices` | Object | Configuration for AWS service mocking | `{}` |
| `runtime` | String | Lambda runtime to simulate | Auto-detected |
| `tracing` | Boolean | Enable AWS X-Ray tracing | `false` |
| `verbose` | Boolean | Enable verbose logging | `false` |

## 🔄 Overriding Configuration

You can override configuration options in several ways:

### 1. Command Line Arguments

```bash
lambda-run handler --timeout 60000 --memory-size 1024
```

### 2. Environment Variables

```bash
LAMBDA_RUNNING_TIMEOUT=60000 LAMBDA_RUNNING_MEMORY_SIZE=1024 lambda-run handler
```

### 3. Per-Directory Configuration

You can have different configurations in different directories. Lambda Running will look for `lambda-running.json` in the current directory and parent directories.

## 🧩 Configuration by Example

### Basic Development Setup

```json
{
  "handlerDirs": ["./src/handlers"],
  "environment": {
    "STAGE": "dev",
    "LOG_LEVEL": "debug"
  },
  "timeout": 30000
}
```

### Testing Setup

```json
{
  "handlerDirs": ["./src/handlers"],
  "environment": {
    "STAGE": "test",
    "LOG_LEVEL": "error",
    "TEST_MODE": "true"
  },
  "mockServices": {
    "dynamodb": {
      "endpoint": "http://localhost:8000",
      "inMemory": true
    }
  }
}
```

### TypeScript Project

```json
{
  "handlerDirs": ["./dist"],
  "envFile": "./.env.development",
  "watchDirs": ["./src"],
  "ignore": ["**/*.test.ts", "**/node_modules/**"]
}
```

### Multi-Function Project

```json
{
  "handlerDirs": [
    "./services/users/handlers",
    "./services/orders/handlers",
    "./services/payments/handlers"
  ],
  "environment": {
    "STAGE": "dev"
  },
  "ui": {
    "port": 3000,
    "theme": "dark"
  }
}
```

## 📂 Configuration File Locations

Lambda Running searches for configuration files in the following order:

1. Path specified with `--config` option
2. `lambda-running.json` in the current directory
3. `.lambda-running.json` in the current directory
4. `lambda-running.json` in parent directories (up to home directory)
5. `.lambda-running.json` in parent directories (up to home directory)
6. Default configuration

## 💼 Environment-Specific Configuration

To use different configurations for different environments:

1. Create multiple configuration files:
   - `lambda-running.dev.json`
   - `lambda-running.test.json`
   - `lambda-running.prod.json`

2. Specify the configuration file when running:
   ```bash
   lambda-run --config lambda-running.dev.json handler
   ```

## 🔍 Next Steps

- [Read about Environment Variables](./environment-variables.md)
- [Explore Lambda Layers](./lambda-layers.md)
- [See Advanced Usage Patterns](../reference/advanced-patterns.md) 