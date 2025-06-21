# 📥 Lambda Running: Installation Guide

This guide walks you through installing Lambda Running and getting your environment set up for local Lambda development.

## 🔧 Prerequisites

Before installing Lambda Running, ensure your system meets these requirements:

- **Node.js**: Version 20.x or later
  - [Download Node.js](https://nodejs.org/)
  - Verify with: `node -v`
- **npm**: Version 6.x or later (included with Node.js)
  - Verify with: `npm -v`
- **Supported platforms**: Windows, macOS, Linux

## 📦 Installation Options

### Option 1: Global Installation (Recommended)

Install Lambda Running globally to use it from anywhere on your system:

```bash
npm install -g lambda-running
```

This makes the `lambda-run` command available globally.

Verify the installation:

```bash
lambda-run --version
```

### Option 2: Local Project Installation

Install as a development dependency in your project:

```bash
npm install --save-dev lambda-running
```

With local installation, you'll need to run Lambda Running via npm scripts or npx:

Using npx:
```bash
npx lambda-run --version
```

Or by adding to your package.json scripts:
```json
{
  "scripts": {
    "lambda": "lambda-run"
  }
}
```

Then run with:
```bash
npm run lambda -- --version
```

## 🔨 Post-Installation Setup

### 1. Create a Configuration File

Create a basic configuration file in your project root:

```bash
lambda-run init
```

This creates a `lambda-running.json` file in your current directory with default settings.

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```
AWS_REGION=us-east-1
MY_LAMBDA_VAR=test-value
```

Lambda Running will automatically load variables from this file when running handlers.

### 3. Install AWS SDK (Optional)

If your Lambda functions use AWS services:

```bash
npm install aws-sdk
```

Lambda Running will automatically mock AWS services during local development.

## 🔄 Upgrading

To upgrade to the latest version:

```bash
# For global installation
npm update -g lambda-running

# For local installation
npm update --save-dev lambda-running
```

## 🧩 Optional Components

### TypeScript Support

If you're using TypeScript, install the TypeScript compiler:

```bash
npm install --save-dev typescript @types/node
```

Create a basic tsconfig.json:

```bash
npx tsc --init
```

### Local DynamoDB (Optional)

For testing with DynamoDB locally:

```bash
# Install DynamoDB local
npm install --save-dev dynamodb-local

# Add to scripts in package.json
"scripts": {
  "dynamodb": "dynamodb-local -port 8000"
}
```

Start local DynamoDB:

```bash
npm run dynamodb
```

## 🔍 Verifying Installation

To verify everything is working correctly:

```bash
# Check version
lambda-run --version

# Run a test function (if you have one)
lambda-run run ./test-handler.js
```

Start the UI server:

```bash
lambda-run ui
```

Navigate to http://localhost:3000 in your browser to confirm the UI is working.

## 🛠️ Troubleshooting Installation

If you encounter issues during installation:

- **Permission errors**: Use `sudo` (on Unix systems) or run as administrator (on Windows)
- **PATH issues**: Ensure npm's global bin directory is in your PATH
- **Version conflicts**: Check for conflicting global packages or version requirements

For more detailed troubleshooting, see the [Troubleshooting Guide](./reference/troubleshooting.md).

## 🔍 Next Steps

- [Read the Quick Start Guide](./quick-start.md)
- [Explore CLI Commands](./reference/cli-reference.md)
- [Configure Lambda Running](./features/configuration.md) 