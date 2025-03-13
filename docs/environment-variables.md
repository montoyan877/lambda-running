# Environment Variables in Lambda Running

Lambda Running now automatically loads environment variables from a `.env` file in your project's root directory.

## Overview

When testing AWS Lambda functions locally, you often need to set environment variables that would normally be configured in the Lambda function's settings in AWS. Lambda Running makes this easy by automatically loading variables from a `.env` file when running your functions.

## How It Works

1. When you run a Lambda handler using the Lambda Running library, it automatically looks for a `.env` file in the current working directory.
2. If found, it parses the file and loads all defined variables into the `process.env` object.
3. Your Lambda function code can then access these environment variables just like it would in AWS.

## `.env` File Format

The `.env` file should follow the standard format of one `KEY=VALUE` pair per line:

```
# This is a comment
DB_HOST=localhost
DB_USER=admin
DB_PASS=secret

# You can use quotes if needed
MESSAGE="Hello World"
OTHER_MESSAGE='Hello there'

# Empty lines are ignored

# You can define complex values
JSON_CONFIG={"key":"value","array":[1,2,3]}
```

## Command Line Options

By default, Lambda Running will always try to load the `.env` file. You can disable this behavior using the `--no-env` flag:

```bash
# Run without loading environment variables
lambda-run run handler.js handlerMethod --event '{"key": "value"}' --no-env
```

## Programmatic API

When using the programmatic API, you can control whether environment variables are loaded:

```javascript
const { runHandler } = require('lambda-running');

// Run without loading environment variables
await runHandler('./handler.js', 'handlerMethod', eventData, {}, { loadEnv: false });

// Run with loading environment variables (default)
await runHandler('./handler.js', 'handlerMethod', eventData, {}, { loadEnv: true });
```

## Best Practices

- Keep sensitive information out of version control by adding `.env` to your `.gitignore` file
- Provide a `.env.example` file in your repository with the structure but without actual values
- Use descriptive environment variable names that match what you would use in AWS
- Remember that in AWS Lambda, environment variables are encrypted at rest
- Use `.lambdarunignore` to exclude the `.env` file from handler scanning
