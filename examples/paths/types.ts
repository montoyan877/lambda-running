/**
 * Common types for alias path examples
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface LambdaEvent {
  userId?: string;
  action?: string;
  payload?: any;
} 