/**
 * Example TypeScript Lambda handler
 */
interface Event {
    action?: string;
    data?: Record<string, any>;
    userId?: string;
}
interface Response {
    statusCode: number;
    headers?: Record<string, string>;
    body: string;
}
export declare const handler: (event: Event, context: any) => Promise<Response>;
export {};
