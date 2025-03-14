'use strict';
/**
 * Example TypeScript Lambda handler using path aliases
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.handler = void 0;
/**
 * Lambda function that handles user operations using imported types from path aliases
 */
const handler = async (event, context) => {
  console.log(`Processing request with ID: ${context.awsRequestId}`);
  if (event.action === 'getUser') {
    if (!event.userId) {
      return {
        success: false,
        error: 'Missing userId',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId,
      };
    }
    // Create a user using imported interfaces
    const user = {
      id: event.userId,
      name: `User ${event.userId}`,
      email: `user${event.userId}@example.com`,
      role: 'customer',
    };
    return {
      success: true,
      data: { user },
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
    };
  }
  return {
    success: true,
    data: { message: 'Operation completed', event },
    timestamp: new Date().toISOString(),
    requestId: context.awsRequestId,
  };
};
exports.handler = handler;
//# sourceMappingURL=handler-with-alias.js.map
