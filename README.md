# 🚀 Lambda Running

![Version](https://img.shields.io/badge/version-0.2.2-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Run & test AWS Lambda functions locally with ease!

## ✨ What is Lambda Running?

Lambda Running is a powerful library that lets you test AWS Lambda functions locally without any complicated setup. Perfect for developers who want to iterate quickly and test their Lambda functions in a realistic environment.

## 🎯 Key Features

- ✅ **UI Mode** - Beautiful web interface with real-time logs
- ✅ **Interactive Mode** - Simple CLI for quick testing
- ✅ **Custom Events** - Test with your own JSON payloads
- ✅ **Zero Configuration** - Works out of the box
- ✅ **TypeScript Support** - Including path aliases (@/*)
- ✅ **Environment Variables** - Automatic loading from `.env` files

## 🖥️ UI Mode (Recommended)

Start the UI mode with a simple command:

```bash
# Install globally
npm install -g lambda-running

# Start UI mode
lambda-run ui
```

UI Mode gives you:
- 🎨 Modern web interface for testing Lambda functions
- 📊 Real-time logs and execution results
- 🔍 Enhanced error visualization and stack traces
- 💾 Save and reuse test events for quick iterations

## 💻 Interactive Mode

If you prefer the command line:

```bash
# Start interactive mode
lambda-run i

# Or run directly
lambda-run run path/to/handler.js handler --event '{"key": "value"}'
```

## 🛠️ Quick Usage Guide

1. **Install**:
   ```bash
   npm install -g lambda-running
   ```

2. **Start UI Mode**:
   ```bash
   lambda-run ui
   ```

3. **Or Use Interactive Mode**:
   ```bash
   lambda-run i
   ```

4. **Direct Command**:
   ```bash
   lambda-run run ./src/handler.js handler --event '{"userId": "123"}'
   ```

## 🔧 Configuration

Lambda Running works with zero configuration, but you can customize:

- **.env files** - Automatically loaded
- **.lambdarunignore** - Skip directories during scanning
- **Custom timeouts, ports, etc.** via environment variables

### 📦 Lambda Layers

Enable AWS Lambda layers support by creating a `lambda-running.json` file in your project root:

```json
{
  "layers": [
    "my-common-layer",
    "my-utils-layer"
  ],
  "layerMappings": {
    "/opt/nodejs/aws-sdk": "./node_modules/aws-sdk",
    "/opt/nodejs/axios": "./node_modules/axios"
  },
  "envFiles": [
    ".env",
    ".env.local"
  ],
  "ignorePatterns": [
    "**/*.test.js",
    "**/__tests__/**"
  ],
  "debug": false
}
```

For a simple layers setup, just specify layer names:

```json
{
  "layers": ["general"]
}
```

This will automatically map `/opt/nodejs/general` to `./layers/general` in your project.

Your local project structure should match AWS Lambda's layer structure:

```
my-project/
├── lambdarunning.config.json
├── handler.js (imports from /opt/nodejs/...)
└── layers/
    └── general/
        └── nodejs/
            └── utils/
                └── index.js
```

> ⚠️ **Important**: Lambda Layers support currently only works for local development. You must download the layer code and place it in your project directory as shown above. This feature does not fetch layers from AWS cloud.

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `layers` | Array | `[]` | Simple array of layer names that will be mapped to the `./layers/{name}` directory |
| `layerMappings` | Object | `{}` | Detailed mappings from Lambda layer paths to local directories |
| `envFiles` | Array | `['.env']` | List of environment files to load (in order of precedence) |
| `ignorePatterns` | Array | `[]` | Additional glob patterns to ignore when scanning for handlers |
| `ignoreLayerFilesOnScan` | Boolean | `true` | Whether to ignore files in the layers directory when scanning for handlers |
| `debug` | Boolean | `false` | Enable debug mode for detailed logging |

## 📚 Learn More

For detailed information, check out:
- Full [API Documentation](https://github.com/montoyan877/lambda-running/tree/main/docs)
- [Examples](https://github.com/montoyan877/lambda-running/tree/main/examples)

## 📝 License

MIT © [Nicolás Montoya](https://github.com/montoyan877)
