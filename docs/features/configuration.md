# ⚙️ Lambda Running: Configuration Guide

This guide explains how to configure Lambda Running to customize its behavior for your specific needs.

## 🔧 Configuration

Lambda Running offers several ways to configure how it works with your Lambda functions and layers, allowing for customization to fit your project's needs.

## Configuration Files

### lambda-running.json

The main configuration file for Lambda Running is `lambda-running.json`, which should be placed in your project's root directory.

You can generate this file automatically with:

```bash
lambda-run init
```

Or create it manually with the following structure:

```json
{
  "layerMappings": {},
  "envFiles": [".env"],
  "ignorePatterns": [
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**"
  ],
  "ignoreLayerFilesOnScan": true,
  "debug": false
}
```

### .lambdarunignore

The `.lambdarunignore` file allows you to specify patterns for files and directories that should be ignored when scanning for Lambda handlers. It works similar to `.gitignore`.

You can generate this file automatically with:

```bash
lambda-run init
```

#### Pattern Format

- Simple directory or file names: `node_modules`, `dist`, `coverage`
- Glob patterns: `**/*.test.js`, `*.config.js`
- Comments: Lines starting with `#` are ignored

#### Example .lambdarunignore file

```
# Dependencies
node_modules
package-lock.json

# Tests
tests
**/*.test.js
**/__tests__

# Build output
dist
build
coverage
```

> **Note:** When listing directories, don't include trailing slashes. Use `coverage` instead of `coverage/` for better compatibility.

## Configuration Options

### Layer Mappings

For more specific layer mappings, use the `layerMappings` object:

```json
{
  "layerMappings": {
    "/opt/nodejs": "layers/common",
  }
}
```

This configuration allows you to:
- Map imports like `/opt/nodejs` to `./src/layers/common`

### Environment Files

Specify which environment files to load:

```json
{
  "envFiles": [".env", ".env.local"]
}
```

Lambda Running will load each file in order, with later files overriding variables from earlier ones.

### Ignore Patterns

Specify patterns for files to ignore when scanning for handlers:

```json
{
  "ignorePatterns": [
    "**/*.test.js",
    "**/*.spec.js",
    "**/__tests__/**",
    "dist/**"
  ]
}
```

### Debug Mode

Enable debug mode for more verbose logging:

```json
{
  "debug": true
}
```

## 🎚️ Configuration Options

### Core Settings

| Option | Type | Description | Default |
|--------|------|-------------|---------|
`layerMappings` | Object | Maps Lambda layer paths to local directories | `{}` |
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