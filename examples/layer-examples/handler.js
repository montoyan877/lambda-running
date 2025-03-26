/**
 * Example Lambda handler using layers with AWS Lambda structure
 */

// Import utils from the layer
const utils = require('/opt/nodejs/utils');

exports.handler = async (event) => {
  utils.logInfo('Handler executed with event:');
  utils.logInfo(JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Hello from Lambda Test Runner!',
        timestamp: utils.formatDate(),
        id: utils.generateId(),
        event: event,
      },
      null,
      2
    ),
  };
};
