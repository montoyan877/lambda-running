# 🚀 Lambda Running: Quick Start Guide

This guide will help you get started with Lambda Running in just a few minutes.

## 📋 Prerequisites

- Node.js 20.x or later
- npm 6.x or later
- An AWS Lambda project (or create a new one)

## ⚡ Five-Minute Quick Start

### 1. Install Lambda Running

```bash
npm install -g lambda-running
```

### 2. Create a Sample Lambda Function

Create a file named `hello.js`:

```javascript
exports.handler = async (event) => {
  console.log('Event received:', event);
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, ${event.name || 'World'}!`,
      timestamp: new Date().toISOString()
    })
  };
};
```

### 3. Run the Function Locally

```bash
lambda-run hello.js
```

This will execute the handler with a default empty event.

### 4. Run with a Custom Event

Create a file named `event.json`:

```json
{
  "name": "Lambda Runner",
  "timestamp": "2023-08-15T12:00:00Z"
}
```

Run with this event:

```bash
lambda-run hello.js -e event.json
```

### 5. Start the UI Mode

```bash
lambda-run ui
```

This will open a browser with the Lambda Running UI where you can:
- Select and run your handlers
- Create and manage test events
- View execution results and logs

## 🧩 Basic Usage Patterns

### Running a Handler with Inline Event

```bash
lambda-run hello.js -i '{"name": "Command Line"}'
```

### Saving and Reusing Events

Save an event:

```bash
lambda-run save-event -i '{"name": "Saved Event"}' my-event
```

Run with the saved event:

```bash
lambda-run hello.js -n my-event
```

### Environment Variables

Set environment variables:

```bash
lambda-run hello.js -v STAGE=dev -v API_URL=https://api.example.com
```

### Watch Mode

Run with automatic reloading when files change:

```bash
lambda-run watch hello.js
```

## 🔍 Exploring the Features

### Function Discovery

Lambda Running automatically discovers functions in your project:

```bash
lambda-run list
```

### Running Multiple Functions in Sequence

```bash
lambda-run hello.js && lambda-run process.js -n order-event
```

### Using AWS SDK

Lambda Running automatically mocks AWS SDK calls:

```javascript
// userService.js
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const params = {
    TableName: 'Users',
    Key: { userId: event.userId }
  };
  
  const result = await dynamodb.get(params).promise();
  return result.Item;
};
```

Run it locally without real AWS resources:

```bash
lambda-run userService.js -i '{"userId": "123"}'
```

## 🛠️ Next Steps

After this quick start, you can explore more advanced features:

- [Configure Lambda Running](./features/configuration.md) for your project
- Learn about [environment management](./features/environment-variables.md)
- Explore [advanced patterns](./reference/advanced-patterns.md) for testing workflows
- Set up [Lambda Layers](./features/lambda-layers.md) for shared code
- Use the [UI Mode](./features/ui-mode.md) for visual testing
- Integrate with [TypeScript](./features/typescript.md)

## 📝 Sample Project Structure

For reference, here's a sample project structure:

```
my-lambda-project/
├── lambda-running.json        # Configuration file
├── .env                       # Environment variables
├── src/
│   ├── handlers/
│   │   ├── users.js           # User management handlers
│   │   ├── orders.js          # Order processing handlers
│   │   └── payments.js        # Payment processing handlers
│   └── utils/
│       ├── db.js              # Database utilities
│       └── validation.js      # Input validation
├── events/
│   ├── create-user.json       # Test event for user creation
│   ├── get-order.json         # Test event for order retrieval
│   └── process-payment.json   # Test event for payment processing
├── tests/
│   └── integration/
│       └── order-flow.js      # Integration test for order flow
└── package.json
```

## 🤔 Need Help?

- [Read the full docs](./README.md)
- [Check the troubleshooting guide](./reference/troubleshooting.md)
- [View advanced patterns](./reference/advanced-patterns.md) 