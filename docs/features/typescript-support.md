# 🧰 Lambda Running: TypeScript Support

Lambda Running provides first-class support for TypeScript, allowing you to develop, test, and debug your Lambda functions written in TypeScript without any additional configuration.

## 🚀 Getting Started with TypeScript

### Prerequisites

To use Lambda Running with TypeScript, you'll need:

1. TypeScript installed in your project:
   ```bash
   npm install --save-dev typescript @types/node
   ```

2. A `tsconfig.json` file (if you don't have one):
   ```bash
   npx tsc --init
   ```

### Running TypeScript Lambda Functions

Lambda Running can run your TypeScript Lambda functions directly:

```bash
lambda-run src/handler.ts
```

Lambda Running automatically:
1. Detects that the file is TypeScript
2. Transpiles it on-the-fly
3. Executes the handler function

No need to compile your TypeScript files to JavaScript first!

## ⚙️ Configuration for TypeScript

### Compiler Options

You can customize the TypeScript compiler options used by Lambda Running in your `lambda-running.json` file:

```json
{
  "typescript": {
    "compilerOptions": {
      "target": "ES2018",
      "module": "CommonJS",
      "sourceMap": true
    }
  }
}
```

If not specified, Lambda Running will use the options from your project's `tsconfig.json` file.

### Source Maps for Debugging

Lambda Running automatically enables source maps for TypeScript files, allowing you to:

1. See meaningful stack traces that reference TypeScript source code
2. Debug TypeScript code directly with the Node.js debugger

To enable debugging with source maps:

```bash
lambda-run src/handler.ts --debug
```

## 🔄 TypeScript Development Workflow

### Watch Mode

Lambda Running's watch mode works perfectly with TypeScript:

```bash
lambda-run watch src/handler.ts
```

This will:
1. Watch your TypeScript files for changes
2. Automatically re-transpile when files change
3. Re-run your handler with the latest code

### UI Mode with TypeScript

The Lambda Running UI fully supports TypeScript handlers:

```bash
lambda-run ui
```

You'll see your TypeScript handlers listed alongside JavaScript handlers, and you can run them with the same experience.

## 🧩 Example: TypeScript Lambda Function

Here's an example TypeScript Lambda function that works with Lambda Running:

```typescript
// src/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDB = new DynamoDB.DocumentClient();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing userId parameter' })
      };
    }
    
    const result = await dynamoDB.get({
      TableName: 'Users',
      Key: { userId }
    }).promise();
    
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item || { message: 'User not found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
```

### Running the Example

```bash
lambda-run src/handler.ts -i '{
  "pathParameters": {
    "userId": "123"
  }
}'
```

## 🔧 Advanced TypeScript Features

### Type-Safe Events

Lambda Running supports importing your TypeScript event type definitions:

```typescript
// events/user-event.ts
export interface UserEvent {
  userId: string;
  action: 'create' | 'update' | 'delete';
  data?: {
    name?: string;
    email?: string;
  };
}
```

When you save events in the UI or via CLI, Lambda Running will use these types for validation.

### Multiple Handlers per File

Lambda Running supports TypeScript files with multiple exported handlers:

```typescript
// src/users.ts
export const createUser = async (event) => {
  // Implementation
};

export const updateUser = async (event) => {
  // Implementation
};

export const deleteUser = async (event) => {
  // Implementation
};
```

You can run a specific handler:

```bash
lambda-run src/users.ts createUser
```

### TypeScript Project Setup Recommendations

For the best experience with Lambda Running and TypeScript:

1. Use a project structure that separates source and compiled code:
   ```
   my-project/
   ├── src/              # TypeScript source files
   │   └── handlers/     # Lambda handler functions
   ├── dist/             # Compiled JavaScript (for deployment)
   ├── events/           # Test events
   ├── tsconfig.json     # TypeScript configuration
   └── lambda-running.json  # Lambda Running configuration
   ```

2. Configure your `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "target": "ES2018",
       "module": "CommonJS",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "sourceMap": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "**/*.test.ts"]
   }
   ```

3. Set up your `lambda-running.json`:
   ```json
   {
     "handlerDirs": ["./src/handlers"],
     "watchDirs": ["./src"],
     "eventDir": "./events"
   }
   ```

## 🧠 TypeScript Debugging Tips

### Debugging with VS Code

1. Create a launch configuration in `.vscode/launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "type": "node",
         "request": "attach",
         "name": "Debug Lambda Function",
         "port": 9229,
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   ```

2. Run your handler with the debug flag:
   ```bash
   lambda-run src/handler.ts --debug
   ```

3. Attach VS Code debugger and set breakpoints in your TypeScript files.

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module" errors | Check your import paths and make sure the modules are installed |
| "Type 'x' is not assignable to type 'y'" | Fix type mismatches in your code |
| Path mapping issues | Configure `baseUrl` and `paths` in your tsconfig.json |

## 🔍 Next Steps

- [Learn about Lambda Layers](./lambda-layers.md)
- [Explore Advanced Patterns](../reference/advanced-patterns.md)
- [Configure Environment Variables](./environment-variables.md) 