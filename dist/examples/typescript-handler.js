'use strict';
/**
 * Example TypeScript Lambda handler
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.handler = void 0;
// Lambda handler function
const handler = async (event, context) => {
  console.log(`Executing TypeScript handler with context: ${context.awsRequestId}`);
  // Check which action to perform
  const action = event.action || 'default';
  // Process based on action
  switch (action) {
    case 'getUser':
      // Validate input
      if (!event.userId) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Missing userId',
            requestId: context.awsRequestId,
          }),
        };
      }
      // Create mock user
      const user = {
        id: event.userId,
        name: `User ${event.userId}`,
        email: `user${event.userId}@example.com`,
        role: 'user',
      };
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          data: { user },
          requestId: context.awsRequestId,
        }),
      };
    case 'processData':
      // Check for data
      if (!event.data) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Missing data',
            requestId: context.awsRequestId,
          }),
        };
      }
      // Process data (just echo it for this example)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          processedData: event.data,
          timestamp: new Date().toISOString(),
          requestId: context.awsRequestId,
        }),
      };
    default:
      // Default handler
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'TypeScript Lambda executed successfully',
          event,
          timestamp: new Date().toISOString(),
          requestId: context.awsRequestId,
        }),
      };
  }
};
exports.handler = handler;
//# sourceMappingURL=typescript-handler.js.map
