# 🧪 Lambda Running: Event Management

Lambda Running allows you to save, organize, and reuse event payloads for testing your AWS Lambda functions.

## ✨ Key Features

- ✅ Save frequently used event payloads
- ✅ Organize events by category
- ✅ Access events across all tools (UI, CLI, API)
- ✅ Edit and update saved events

## 📝 Working with Events

### Creating Events

Events are JSON objects that serve as input to your Lambda functions:

```json
{
  "httpMethod": "GET",
  "path": "/users",
  "queryStringParameters": {
    "limit": "10"
  },
  "headers": {
    "Authorization": "Bearer test-token"
  }
}
```

### Saving Events

You can save events in different ways:

#### 1. Using the UI

1. Enter your event in the JSON editor
2. Click "Save Event"
3. Enter a name and optional category
4. Click "Save"

#### 2. Using the CLI

```bash
# Save directly with the --save flag
lambda-run run handler.js handler --event '{"name":"Test"}' --save myTestEvent

# Save during interactive mode
lambda-run i
# Choose "Save this event for future use" when prompted after execution
```

#### 3. Using the API

```javascript
const { saveEvent } = require('lambda-running');

saveEvent('loginEvent', {
  username: 'testuser',
  password: 'password123'
}, 'auth');
```

### Using Saved Events

#### 1. In the UI

1. Select a handler
2. Click "Load Event"
3. Choose from your saved events
4. Click "Run"

#### 2. In the CLI

```bash
# Use with run command
lambda-run run handler.js handler --event-name myTestEvent

# Use in interactive mode
lambda-run i
# Choose "Use a saved event" when prompted
```

#### 3. Using the API

```javascript
const { getEvent, runHandler } = require('lambda-running');

// Get a saved event
const event = getEvent('loginEvent', 'auth');

// Run a handler with the event
await runHandler('./auth.js', 'handler', event.data);
```

## 🗂️ Event Categories

Events can be organized into categories for better management:

```bash
# Save an event to a specific category
lambda-run run handler.js handler --event '{"type":"user"}' --save userEvent --category users

# List events in a category
lambda-run events --category users

# Use an event from a category
lambda-run run handler.js handler --event-name userEvent --category users
```

### Example Category Structure

```
~/.lambda-running/events/
├── default/             # Default category
│   ├── simpleEvent.json
│   └── testEvent.json
├── users/               # User-related events
│   ├── createUser.json
│   └── loginUser.json
└── api/                 # API-related events
    ├── getRequest.json
    └── postRequest.json
```

## 🔍 Listing Events

To see all your saved events:

```bash
# List all events
lambda-run events

# List events in JSON format
lambda-run events --json

# List events in a specific category
lambda-run events --category api
```

## ❌ Deleting Events

To remove saved events:

```bash
# Delete an event
lambda-run delete-event myEvent

# Delete an event from a specific category
lambda-run delete-event userEvent --category users
```

## 🔌 Programmatic API

Lambda Running provides functions for event management in your code:

```javascript
const { 
  saveEvent,   // Save an event
  getEvents,   // Get all events
  getEvent,    // Get a specific event
  deleteEvent  // Delete an event
} = require('lambda-running');

// Save an event
saveEvent('apiTest', { path: '/users', method: 'GET' }, 'api');

// Get all events (with or without data)
const allEvents = getEvents(true); // Include event data
const eventList = getEvents(false); // Just metadata

// Get events from a category
const apiEvents = getEvents(true, 'api');

// Get a specific event
const event = getEvent('apiTest', 'api');

// Delete an event
deleteEvent('apiTest', 'api');
```

## 💡 Best Practices

- **Use categories**: Organize events by function or feature
- **Naming conventions**: Use clear, descriptive names 
- **Templates**: Create base templates for common event types
- **Versioning**: Include version information in event names or data for API changes
- **Minimal data**: Keep events focused on required fields

## 📋 Event Templates

Here are some common event templates:

### API Gateway Event

```json
{
  "httpMethod": "GET",
  "path": "/resource",
  "queryStringParameters": { "param": "value" },
  "headers": { "Content-Type": "application/json" },
  "body": "{\"key\":\"value\"}"
}
```

### SQS Event

```json
{
  "Records": [
    {
      "messageId": "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
      "receiptHandle": "MessageReceiptHandle",
      "body": "{\"key\":\"value\"}",
      "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1523232000000",
        "SenderId": "123456789012",
        "ApproximateFirstReceiveTimestamp": "1523232000001"
      },
      "messageAttributes": {},
      "md5OfBody": "7b270e59b47ff90a553787216d55d91d",
      "eventSource": "aws:sqs",
      "eventSourceARN": "arn:aws:sqs:us-east-1:123456789012:MyQueue",
      "awsRegion": "us-east-1"
    }
  ]
}
```

### S3 Event

```json
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "us-east-1",
      "eventTime": "2020-03-08T00:00:00.000Z",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "bucket": {
          "name": "my-bucket",
          "arn": "arn:aws:s3:::my-bucket"
        },
        "object": {
          "key": "test/file.txt",
          "size": 1024,
          "eTag": "abcdef1234567890"
        }
      }
    }
  ]
}
```

## 🔍 Next Steps

- [Try UI Mode](../ui-mode.md)
- [Explore CLI commands](../cli-usage.md)
- [Configure Lambda Running](../configuration.md) 