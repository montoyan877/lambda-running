/**
 * Example TypeScript Lambda handler using path aliases
 */
import { ApiResponse, LambdaEvent } from '@/examples/paths/types';
/**
 * Lambda function that handles user operations using imported types from path aliases
 */
export declare const handler: (event: LambdaEvent, context: any) => Promise<ApiResponse<any>>;
