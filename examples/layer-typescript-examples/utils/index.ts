import { formatDate } from "/opt/nodejs/utils";

/**
 * Utils layer - Provides common utility functions (AWS Lambda structure)
 */
export const logInfo = (message: string) => {
  console.log(`[INFO][${formatDate()}] ${message}`);
};
