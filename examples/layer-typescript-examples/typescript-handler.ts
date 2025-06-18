/**
 * Example Lambda handler using layers with AWS Lambda structure
 */

// Import utils from the layer
import { formatDate, generateId } from '/opt/nodejs/utils';
import { logInfo } from './utils';

export const handler = async (event: any) => {
  logInfo('Handler executed with event:');
  logInfo(JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello from Lambda Test Runner!',
        timestamp: formatDate(),
        id: generateId(),
        event: event,
      },
      null,
      2
    ),
  };
};
