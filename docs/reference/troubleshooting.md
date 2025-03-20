# 🛠️ Lambda Running: Troubleshooting Guide

This guide helps you resolve common issues that might arise when using Lambda Running for local Lambda development and testing.

## 🔍 Common Issues and Solutions

### Installation Problems

#### npm Installation Fails

**Issue**: Unable to install Lambda Running via npm.

**Solutions**:
- Ensure you have Node.js 14.x or later installed: `node -v`
- Try clearing the npm cache: `npm cache clean --force`
- If behind a corporate proxy, check your npm proxy settings
- Try installing with verbose logging: `npm install lambda-running --verbose`

#### Global Installation Issues

**Issue**: Commands not available after global installation.

**Solutions**:
- Ensure the global npm bin directory is in your PATH
- Try installing with the `-g` flag: `npm install -g lambda-running`
- On Windows, you might need to run CMD or PowerShell as administrator

### Configuration Issues

#### Configuration File Not Found

**Issue**: Lambda Running can't find your configuration file.

**Solutions**:
- Check that the file exists at the expected location (default: `lambda-running.json` in current directory)
- Specify the path explicitly: `lambda-run --config ./path/to/config.json`
- Create a new configuration file: `lambda-run init`

#### Environment Variables Not Loading

**Issue**: Environment variables defined in your `.env` file are not being loaded.

**Solutions**:
- Ensure your `.env` file is in the right location (project root)
- Check the formatting of your `.env` file (should be `KEY=VALUE` pairs, one per line)
- Manually load environment variables: `lambda-run --env-file ./path/to/.env handler`

### Handler Execution Problems

#### Handler Not Found

**Issue**: Lambda Running cannot find your handler function.

**Solutions**:
- Check the path to the handler file is correct
- Ensure the function is properly exported (e.g., `exports.handler = async (event) => {...}`)
- For TypeScript files, ensure they are compiled before running
- Try specifying the full path: `lambda-run ./path/to/file.js handlerName`

#### Module Import Errors

**Issue**: Your handler fails with "Cannot find module" errors.

**Solutions**:
- Check that all dependencies are installed: `npm install`
- For local modules, ensure the import paths are correct (relative to the handler file)
- If using TypeScript, check your `tsconfig.json` for correct module resolution settings
- For native modules, ensure you have the appropriate build tools installed

#### Timeout Issues

**Issue**: Handler execution times out.

**Solutions**:
- Increase the timeout in your configuration: `"timeout": 30000` (in milliseconds)
- Check for infinite loops or async operations that don't resolve
- Ensure promises are properly awaited in async handlers
- Add logs to trace execution flow and identify slow operations

### Event Management Issues

#### Cannot Save Events

**Issue**: Unable to save event payloads.

**Solutions**:
- Ensure you have write permissions to the events directory
- Check if the events directory exists, create it if needed
- Verify the event data is valid JSON
- Try using absolute paths: `lambda-run save-event ./path/to/event.json myEvent`

#### Events Not Appearing in UI

**Issue**: Saved events don't appear in the UI.

**Solutions**:
- Restart the UI server: `lambda-run ui`
- Check if events are saved in the correct location (default: `.lambda-running/events`)
- Ensure the event files have the correct format (JSON with a `.json` extension)
- Clear browser cache or try a different browser

### UI Server Issues

#### UI Server Won't Start

**Issue**: The UI server fails to start.

**Solutions**:
- Check if another process is using the same port (default: 3000)
- Specify a different port: `lambda-run ui --port 3001`
- Ensure you have permissions to bind to the port
- Look for error messages in the console output

#### WebSocket Connection Issues

**Issue**: Real-time updates in the UI aren't working.

**Solutions**:
- Check if your firewall is blocking WebSocket connections
- Ensure your browser supports WebSockets
- Try a different browser
- Check console errors in the browser's developer tools

### AWS Service Mocking

#### AWS SDK Calls Failing

**Issue**: Calls to AWS services are failing in the local environment.

**Solutions**:
- Ensure you're using the AWS SDK v2 or v3, which Lambda Running can mock
- Check if you've configured AWS credentials properly
- For unsupported services, consider setting up a mock implementation
- Use the `--aws-endpoint` option to point to a local service like LocalStack

#### DynamoDB Operations Not Working

**Issue**: DynamoDB operations in your handler fail locally.

**Solutions**:
- Set up a local DynamoDB: `lambda-run --dynamodb-local`
- Configure your handler to use the local endpoint: `process.env.AWS_ENDPOINT = 'http://localhost:8000'`
- Check your table definitions match between local and cloud environments
- Use `--verbose` flag to see detailed AWS SDK calls: `lambda-run --verbose handler`

### Lambda Layers Issues

#### Lambda Layers Not Loading

**Issue**: Lambda Layers specified in configuration aren't being loaded.

**Solutions**:
- Ensure layer paths are correct in your configuration
- Check that layer contents are extracted to the expected structure
- Verify layer compatibility with your runtime
- Try manually including the layer content in your project for testing

#### Issues with Native Dependencies in Layers

**Issue**: Native modules in Lambda Layers don't work locally.

**Solutions**:
- Ensure the native modules are compiled for the same platform and architecture
- For cross-platform testing, consider using Docker
- Check if the module requires specific environment variables or system libraries
- Use a Lambda container image locally for better compatibility

## 🔄 Runtime-specific Issues

### Node.js Issues

#### Node.js Version Mismatch

**Issue**: Code that works in AWS Lambda fails locally due to Node.js version differences.

**Solutions**:
- Install the same Node.js version locally as your Lambda runtime
- Use nvm to switch Node.js versions: `nvm use 16` (for Node.js 16.x)
- Consider using Docker with the appropriate AWS Lambda runtime image
- Check for features that might not be supported in older Node.js versions

#### ESM vs CommonJS Issues

**Issue**: ES modules (`import`/`export`) not working with Lambda Running.

**Solutions**:
- Configure your project to use CommonJS (`require`/`exports`) for compatibility
- If using ESM, ensure your `package.json` has `"type": "module"`
- For TypeScript, configure the compiler to output CommonJS: `"module": "CommonJS"` in `tsconfig.json`
- Use the experimental support for ESM: `lambda-run --experimental-modules handler`

### Python Issues

#### Python Dependencies Not Found

**Issue**: Python Lambda functions can't find installed dependencies.

**Solutions**:
- Install dependencies locally: `pip install -r requirements.txt`
- Use a virtual environment that matches your Lambda configuration
- Set the PYTHONPATH environment variable to include your dependencies
- Package dependencies in a Lambda Layer following AWS's structure

#### Python Version Compatibility

**Issue**: Code works differently in AWS Lambda than locally due to Python version differences.

**Solutions**:
- Install the same Python version locally as your Lambda runtime
- Use pyenv to manage multiple Python versions
- Consider using Docker with the appropriate AWS Lambda runtime image
- Check for features that might be version-specific

## 🔍 Debugging Techniques

### Using Verbose Logging

To get more detailed logs about what's happening:

```bash
lambda-run --verbose handler
```

This will show detailed information about:
- Handler resolution
- Event processing
- AWS SDK calls
- Runtime environment setup

### Debug Mode

Enable debug mode for even more detailed information:

```bash
lambda-run --debug handler
```

### Inspecting with Node.js Debugger

To use the Node.js debugger with Lambda Running:

```bash
lambda-run --inspect handler
```

Then connect with Chrome DevTools or VS Code debugger.

### Saving Execution Results

Save the results of handler executions for analysis:

```bash
lambda-run handler --save-result ./results/test1.json
```

### Tracing Execution

For complex handlers, enable tracing to track execution flow:

```bash
lambda-run --trace handler
```

## 🔄 Reporting Issues

If you encounter an issue not covered in this guide:

1. Check the [GitHub Issues](https://github.com/yourusername/lambda-running/issues) to see if it's already reported
2. Gather information about your environment:
   ```bash
   lambda-run --version
   node -v
   npm -v
   ```
3. Create a minimal reproduction of the issue
4. Open a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Environment details
   - Error messages and logs

## 🔍 Next Steps

- [Return to CLI Reference](./cli-reference.md)
- [Explore Advanced Patterns](./advanced-patterns.md)
- [Read the API Reference](./api-reference.md) 