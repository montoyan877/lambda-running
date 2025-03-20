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
  "layers": [
    "my-common-layer",
    "my-utils-layer"
  ],
  "layerMappings": {
    "/opt/nodejs/my-common-layer": "./layers/my-common-layer",
    "/opt/nodejs/aws-sdk": "./node_modules/aws-sdk",
    "/opt/nodejs/axios": "./node_modules/axios"
  },
  "envFiles": [
    ".env",
    ".env.local",
    ".env.test"
  ],
  "ignorePatterns": [
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**"
  ],
  "ignoreLayerFilesOnScan": true,
  "debug": false
}
```

## 🎚️ Configuration Options

### Core Settings

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `layers` | Array | Simple array of layer names to map | `[]` |
| `layerMappings` | Object | Maps Lambda layer paths to local directories | `{}` |
| `envFiles` | Array | List of environment files to load | `['.env']` |
| `ignorePatterns` | Array | Glob patterns for files to ignore when scanning for handlers | `[]` |
| `ignoreLayerFilesOnScan` | Boolean | Whether to ignore layer files when scanning | `true` |
| `debug` | Boolean | Enable debug mode for verbose logging | `false` |

## 🔄 Overriding Configuration

You can override configuration options in several ways:

### 1. Command Line Arguments

```bash
lambda-run handler --debug
```

### 2. Environment Variables

```bash
LAMBDA_RUNNING_DEBUG=true lambda-run handler
```

### 3. Per-Directory Configuration

You can have different configurations in different directories. Lambda Running will look for `lambda-running.json` in the current directory and parent directories.

## 🧩 Configuration by Example

### Basic Development Setup

```json
{
  "layers": ["common-utils"],
  "envFiles": [".env", ".env.dev"],
  "debug": true
}
```

### Testing Setup

```json
{
  "envFiles": [".env", ".env.test"],
  "ignorePatterns": [
    "**/*.test.js",
    "**/__mocks__/**"
  ],
  "debug": true
}
```

### Lambda Layers Setup

```json
{
  "layers": ["data-layer", "api-layer"],
  "layerMappings": {
    "/opt/nodejs/aws-sdk": "./node_modules/aws-sdk",
    "/opt/nodejs/axios": "./node_modules/axios"
  },
  "ignoreLayerFilesOnScan": true
}
```

### Multiple Environment Setup

```json
{
  "envFiles": [
    ".env",
    ".env.local",
    ".env.development"
  ],
  "debug": false
}
```

## 📂 Configuration File Locations

Lambda Running searches for configuration files in the following order:

1. Path specified with `--config` option
2. `lambda-running.json` in the current directory
3. `lambdarunning.config.json` in the current directory (legacy support)
4. `lambda-running.json` in parent directories (up to home directory)
5. `.lambda-running/config.json` in the current directory
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
- [See Advanced Patterns](../reference/advanced-patterns.md) 