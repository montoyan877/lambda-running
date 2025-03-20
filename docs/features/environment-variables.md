# 🌐 Lambda Running: Environment Variables

Lambda Running automatically loads environment variables from `.env` files, making it easy to simulate different environments.

## ✨ Key Features

- ✅ Automatic loading from `.env` files
- ✅ Multiple environment file support
- ✅ Environment-specific configurations
- ✅ Simple syntax matching AWS Lambda

## 🏃‍♂️ Quick Usage

Create a `.env` file in your project root:

```
# Database configuration
DB_HOST=localhost
DB_USER=admin
DB_PASS=secret

# API keys
API_KEY=test-api-key-123

# AWS settings
AWS_REGION=us-east-1
```

Lambda Running automatically loads these variables when running your functions:

```bash
lambda-run run ./handler.js handler --event '{}'
```

Your handler code can access these variables through `process.env`:

```javascript
exports.handler = async (event) => {
  console.log(`Using database: ${process.env.DB_HOST}`);
  console.log(`AWS Region: ${process.env.AWS_REGION}`);
  
  // Use the variables in your code
  const apiClient = new ApiClient(process.env.API_KEY);
  
  return { success: true };
};
```

## 🔄 Multiple Environment Files

You can configure Lambda Running to load from multiple `.env` files:

```json
// lambdarunning.config.json
{
  "envFiles": [
    ".env",            // Base variables
    ".env.development" // Environment-specific overrides
  ]
}
```

Variables are loaded in order, with later files taking precedence over earlier ones.

### Example Setup

```
my-project/
├── .env                  # Default variables for all environments
├── .env.development      # Development-specific variables 
├── .env.test             # Testing-specific variables
├── .env.production       # Production-like variables
└── lambdarunning.config.json
```

## 📄 .env File Format

The `.env` file follows a simple `KEY=VALUE` format:

```
# Comments start with #
SIMPLE_VAR=value

# Empty lines are ignored

# You can use quotes if needed
MESSAGE="Hello World"
OTHER_MESSAGE='Hello there'

# Multiline values work too
JSON_CONFIG={"key":"value",
"array":[1,2,3]}
```

## 🎮 Command-Line Options

You can disable environment variable loading with the `--no-env` flag:

```bash
lambda-run run handler.js handler --event '{}' --no-env
```

## 🔌 Programmatic API

When using the programmatic API, you can control whether environment variables are loaded:

```javascript
const { runHandler } = require('lambda-running');

// With environment variables (default)
await runHandler('./handler.js', 'handler', eventData, {}, { loadEnv: true });

// Without environment variables
await runHandler('./handler.js', 'handler', eventData, {}, { loadEnv: false });
```

## 💡 Best Practices

- **Security**: Keep sensitive values out of version control by adding `.env` to your `.gitignore`
- **Templates**: Provide a `.env.example` file with the structure but not actual values
- **Consistency**: Use the same variable names locally as you do in AWS Lambda
- **Documentation**: Comment your `.env` files to explain what each variable is for
- **Defaults**: Set sensible defaults for local development

## 🔄 Environment Variable Types

Lambda Running supports different types of environment variables:

### 1. Configuration Variables

These control Lambda Running's own behavior:

```
LAMBDA_RUNNING_EVENT_DIR=~/.lambda-running/events
LAMBDA_RUNNING_TIMEOUT=30000
LAMBDA_RUNNING_UI_PORT=3000
LAMBDA_RUNNING_UI_OPEN=true
```

### 2. Function Variables

These are passed to your Lambda function:

```
# Database settings
DB_HOST=localhost
DB_PASSWORD=secret

# API settings
API_URL=https://api.example.com
API_KEY=your-test-key
```

## 🔍 Next Steps

- [Configure Lambda Running](../configuration.md)
- [Learn about Lambda Layers](./lambda-layers.md)
- [Explore event management](./event-management.md) 