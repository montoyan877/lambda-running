/**
 * Example TypeScript Lambda handler using path aliases
 */

// Import using path alias (this would typically be '@/examples/paths/types')
// For this example, since we're in the same project, we'll use a simpler alias
import { User, ApiResponse, LambdaEvent } from '@/examples/paths/types';
import { print } from '@/examples/paths/utils';

/**
 * Lambda function that handles user operations using imported types from path aliases
 */
export const handler = async (event: LambdaEvent, context: any): Promise<ApiResponse<any>> => {
  print(`Processing request with ID: ${context.awsRequestId}`);
  
  if (event.action === 'getUser') {
    if (!event.userId) {
      return {
        success: false,
        error: 'Missing userId',
        timestamp: new Date().toISOString(),
        requestId: context.awsRequestId
      };
    }
    
    // Create a user using imported interfaces
    const user: User = {
      id: event.userId,
      name: `User ${event.userId}`,
      email: `user${event.userId}@example.com`,
      role: 'customer'
    };
    
    return {
      success: true,
      data: { user },
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId
    };
  }
  
  return {
    success: true,
    data: { message: 'Operation completed', event },
    timestamp: new Date().toISOString(),
    requestId: context.awsRequestId
  };
}; 