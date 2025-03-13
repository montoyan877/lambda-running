# TypeScript Support in Lambda Running

Lambda Running provides first-class support for TypeScript Lambda functions, allowing you to test your TypeScript handlers directly without needing to compile them first.

## Overview

TypeScript is becoming increasingly popular for writing AWS Lambda functions due to its strong typing system and excellent IDE support. Lambda Running makes it easy to test these functions locally by:

1. Automatically detecting and using your project's `tsconfig.json` configuration
2. Leveraging `ts-node` to run TypeScript files directly
3. Supporting path aliases like `@/*` in your imports (with tsconfig-paths)
4. Providing proper error messages when TypeScript support is missing

## How It Works

When you run a TypeScript Lambda handler with Lambda Running:

1. The tool checks if `ts-node` is installed and available
2. It looks for a `tsconfig.json` file in your project root
3. If found, it uses your configuration for running TypeScript files
4. It detects path aliases in your tsconfig.json (like `@/*`) and enables support for them
5. If not found, it uses sensible defaults (CommonJS modules and ES2017 target)
6. When running a specific handler, it also checks if there's a `tsconfig.json` in the handler's directory

## Prerequisites

To use TypeScript with Lambda Running, you need to have these packages installed:

```bash
# Basic TypeScript support
npm install -g ts-node typescript

# For projects using path aliases (@/* imports)
npm install --save-dev tsconfig-paths
```

Or as development dependencies in your project:

```bash
npm install --save-dev ts-node typescript tsconfig-paths
```

## Path Aliases Support

If your project uses path aliases like `@/*` in the imports:

```typescript
// Example using path alias
import { ValueObject } from '@/src/common/domain/valueObjects/ValueObject';
```

You need to:

1. Make sure `tsconfig-paths` is installed
2. Have proper configuration in your tsconfig.json:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"]
    }
    // other options...
  }
}
```

Lambda Running will automatically detect these settings and enable path alias resolution.

## Configuration Priority

Lambda Running uses the following priority order when determining which TypeScript configuration to use:

1. Handler directory's `tsconfig.json` (if available and the handler is in a different directory)
2. Project root's `tsconfig.json`
3. Default configuration (CommonJS modules, ES2017 target)

This ensures that your TypeScript Lambda functions run with the appropriate configuration for their specific needs.

## Example Using TypeScript

Let's say you have a TypeScript Lambda function:

```typescript
// handler.ts
interface User {
  userId: string;
  name?: string;
  email?: string;
}

interface Response {
  statusCode: number;
  body: string;
}

export const handler = async (event: User, context: any): Promise<Response> => {
  if (!event.userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing userId' }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'User processed successfully',
      user: event,
      requestId: context.awsRequestId,
    }),
  };
};
```

You can test this function directly using Lambda Running:

```bash
lambda-run run handler.ts handler --event '{"userId": "123", "name": "John Doe"}'
```

Or in interactive mode:

```bash
lambda-run i
```

## Troubleshooting

If you encounter issues with TypeScript:

1. **"TypeScript files require ts-node"**: Install ts-node globally or as a dev dependency
2. **Compilation errors**: Check that your tsconfig.json is properly configured
3. **Import errors**: Ensure your tsconfig.json has appropriate module resolution settings

For complex TypeScript projects, consider using a custom tsconfig.json in the same directory as your Lambda handlers to ensure the correct settings are applied.
