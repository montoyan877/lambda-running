# 🔍 Lambda Running: Advanced Patterns

This guide explores advanced usage patterns and techniques for Lambda Running, helping you get the most out of the tool for complex testing scenarios.

## 🔄 Testing Workflows

### Sequential Function Execution

Test a sequence of Lambda functions that work together:

```javascript
const { runHandler, getEvent } = require('lambda-running');

async function testOrderWorkflow() {
  // Step 1: Create user
  const createUserEvent = getEvent('createUser', 'orders').data;
  const user = await runHandler('./users.js', 'createUser', createUserEvent);
  
  // Step 2: Create order with user ID
  const createOrderEvent = {
    ...getEvent('createOrder', 'orders').data,
    userId: user.id
  };
  const order = await runHandler('./orders.js', 'createOrder', createOrderEvent);
  
  // Step 3: Process payment
  const processPaymentEvent = {
    orderId: order.id,
    amount: order.total,
    paymentMethod: 'credit_card'
  };
  const payment = await runHandler('./payments.js', 'processPayment', processPaymentEvent);
  
  // Return the entire workflow result
  return { user, order, payment };
}
```

### Custom Test Harness

Create a reusable test harness for similar Lambda functions:

```javascript
const { runHandler } = require('lambda-running');

async function testApiEndpoint(endpoint, method, payload, expectedStatus) {
  // Construct API Gateway event
  const event = {
    httpMethod: method,
    path: endpoint,
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Run the handler
  const result = await runHandler('./api-handler.js', 'handler', event);
  
  // Validate response
  if (result.statusCode !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${result.statusCode}`);
  }
  
  // Return the parsed body
  return JSON.parse(result.body);
}

// Usage
const user = await testApiEndpoint('/users', 'POST', { name: 'Test User' }, 201);
const users = await testApiEndpoint('/users', 'GET', null, 200);
```

## 🔄 Dynamic Event Generation

### Data-Driven Testing

Generate test events from a dataset:

```javascript
const { runHandler } = require('lambda-running');

async function runDataDrivenTests() {
  const testCases = [
    { name: 'Empty payload', data: {}, expectedStatus: 400 },
    { name: 'Missing name', data: { email: 'test@example.com' }, expectedStatus: 400 },
    { name: 'Missing email', data: { name: 'Test' }, expectedStatus: 400 },
    { name: 'Valid data', data: { name: 'Test', email: 'test@example.com' }, expectedStatus: 200 }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      const result = await runHandler('./validate.js', 'handler', testCase.data);
      const success = result.statusCode === testCase.expectedStatus;
      
      results.push({
        name: testCase.name,
        success,
        actual: result.statusCode,
        expected: testCase.expectedStatus
      });
    } catch (error) {
      results.push({
        name: testCase.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}
```

### Event Factories

Create flexible event factories for cleaner testing:

```javascript
// event-factory.js
function createApiEvent(options = {}) {
  const defaults = {
    httpMethod: 'GET',
    path: '/',
    queryStringParameters: {},
    headers: { 'Content-Type': 'application/json' },
    body: null
  };
  
  const event = { ...defaults, ...options };
  
  // Stringify body if provided as object
  if (event.body && typeof event.body === 'object') {
    event.body = JSON.stringify(event.body);
  }
  
  return event;
}

// Usage
const { runHandler } = require('lambda-running');
const { createApiEvent } = require('./event-factory');

const getUserEvent = createApiEvent({ path: '/users/123' });
const createUserEvent = createApiEvent({
  httpMethod: 'POST',
  path: '/users',
  body: { name: 'Test User', email: 'test@example.com' }
});

await runHandler('./api.js', 'handler', getUserEvent);
```

## 🔧 Environment Manipulation

### Environment Switching

Test a function with different environments:

```javascript
const { runHandler } = require('lambda-running');
const fs = require('fs');
const path = require('path');

async function testAcrossEnvironments() {
  const envFiles = ['dev', 'test', 'prod'];
  const results = {};
  
  for (const env of envFiles) {
    // Create temporary .env file
    fs.copyFileSync(
      path.join(process.cwd(), `.env.${env}`),
      path.join(process.cwd(), '.env')
    );
    
    // Run with this environment
    results[env] = await runHandler('./handler.js', 'handler', { test: true });
  }
  
  // Restore original .env
  if (fs.existsSync(path.join(process.cwd(), '.env.backup'))) {
    fs.copyFileSync(
      path.join(process.cwd(), '.env.backup'),
      path.join(process.cwd(), '.env')
    );
  }
  
  return results;
}
```

### Custom Context Builder

Create context objects that simulate different Lambda environments:

```javascript
function createContext(options = {}) {
  const timestamp = Date.now();
  
  return {
    awsRequestId: options.requestId || `test-${timestamp}`,
    functionName: options.functionName || 'local-test',
    functionVersion: options.version || '$LATEST',
    memoryLimitInMB: options.memory || '128',
    identity: options.identity,
    clientContext: options.clientContext,
    logGroupName: `/aws/lambda/${options.functionName || 'local-test'}`,
    logStreamName: `${options.version || '$LATEST'}/[${timestamp}]`,
    getRemainingTimeInMillis: () => options.timeout || 30000,
    callbackWaitsForEmptyEventLoop: true,
    invokedFunctionArn: options.arn || `arn:aws:lambda:us-east-1:123456789012:function:${options.functionName || 'local-test'}`
  };
}

// Usage
const context = createContext({
  functionName: 'user-api',
  version: 'v1.0.0',
  memory: '256',
  timeout: 60000
});

const result = await runHandler('./handler.js', 'handler', event, context);
```

## 🎮 Automated Testing Integration

### Jest Integration

Integrate with Jest for structured testing:

```javascript
// users.test.js
const { runHandler } = require('lambda-running');

describe('User API', () => {
  let userId;
  
  test('creates a user successfully', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com'
      })
    };
    
    const result = await runHandler('./users.js', 'handler', event);
    expect(result.statusCode).toBe(201);
    
    const body = JSON.parse(result.body);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('Test User');
    
    userId = body.id; // Save for later tests
  });
  
  test('retrieves a created user', async () => {
    const event = {
      httpMethod: 'GET',
      path: `/users/${userId}`
    };
    
    const result = await runHandler('./users.js', 'handler', event);
    expect(result.statusCode).toBe(200);
    
    const body = JSON.parse(result.body);
    expect(body.id).toBe(userId);
  });
});
```

### CI/CD Pipeline Integration

Run Lambda tests in CI/CD environments:

```javascript
// test-runner.js
const { runHandler, scanForHandlers } = require('lambda-running');
const fs = require('fs');

async function runAllTests() {
  // Find all handlers
  const handlers = scanForHandlers('./src', ['.js']);
  
  // Load test events
  const events = JSON.parse(fs.readFileSync('./test-events.json', 'utf8'));
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  // Run each handler with each applicable event
  for (const handler of handlers) {
    const handlerEvents = events[handler.path] || [];
    
    for (const event of handlerEvents) {
      results.total++;
      
      try {
        const result = await runHandler(handler.path, 'handler', event.payload);
        const success = typeof event.validate === 'function' 
          ? event.validate(result)
          : true;
          
        if (success) {
          results.passed++;
        } else {
          results.failed++;
        }
        
        results.details.push({
          handler: handler.path,
          event: event.name,
          success,
          result
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          handler: handler.path,
          event: event.name,
          success: false,
          error: error.message
        });
      }
    }
  }
  
  // Write results to file
  fs.writeFileSync('./test-results.json', JSON.stringify(results, null, 2));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
```

## 🔌 Custom UI Integration

### Embedded UI

Embed Lambda Running UI in your own application:

```javascript
const express = require('express');
const { start: startLambdaUI } = require('lambda-running/ui');

const app = express();

// Your application routes
app.get('/', (req, res) => {
  res.send('Main application');
});

app.get('/admin', (req, res) => {
  res.send('Admin panel');
});

// Lambda UI proxy
app.use('/lambda-ui', (req, res, next) => {
  // Forward to Lambda Running UI
  req.url = req.originalUrl.replace('/lambda-ui', '');
  next();
});

// Start server
const server = app.listen(8080, async () => {
  console.log('Main server running on port 8080');
  
  // Start Lambda UI server
  try {
    await startLambdaUI({
      port: 3000,
      open: false
    });
    console.log('Lambda UI available at http://localhost:8080/lambda-ui');
  } catch (error) {
    console.error('Failed to start Lambda UI:', error);
  }
});
```

## 🧠 Advanced Patterns

### Dependency Injection

Override handlers' dependencies for cleaner testing:

```javascript
// Original handler with DynamoDB dependency
// users.js
const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const params = {
    TableName: process.env.USERS_TABLE,
    Item: {
      id: event.userId,
      name: event.name,
      email: event.email
    }
  };
  
  await dynamoDB.put(params).promise();
  return { success: true };
};

// Mock for testing
// test/users.test.js
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { runHandler } = require('lambda-running');

// Create mock implementation
const mockDynamoDB = {
  put: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({})
  })
};

// Replace the implementation
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn().mockImplementation(() => mockDynamoDB)
  }
}));

test('creates user in DynamoDB', async () => {
  const event = {
    userId: '123',
    name: 'Test User',
    email: 'test@example.com'
  };
  
  process.env.USERS_TABLE = 'users-test';
  
  const result = await runHandler('./users.js', 'handler', event);
  
  expect(result.success).toBe(true);
  expect(mockDynamoDB.put).toHaveBeenCalledWith({
    TableName: 'users-test',
    Item: {
      id: '123',
      name: 'Test User',
      email: 'test@example.com'
    }
  });
});
```

## 🔍 Next Steps

- [Explore the API Reference](./api-reference.md)
 