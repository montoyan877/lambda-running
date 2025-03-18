/**
 * Example Lambda handler that demonstrates clean output
 * Shows how logs from the lambda function appear in the Output
 * while system logs do not appear
 */

// Handler function that returns environment information
exports.handler = async (event) => {
  // Standard console.log will now appear only in Output
  console.log('This log is only shown in Output');
  console.warn('This warning also appears in Output');
  
  // Use lambdaLog to ensure something appears in Output
  if (global.lambdaLog) {
    global.lambdaLog('This message uses lambdaLog() and is always shown in Output');
  }
  
  if (global.systemLog) {
    global.systemLog('This message uses systemLog() and is never shown in Output');
  }
  
  // Simulating processing
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return something meaningful
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Function executed with clean output',
        eventReceived: event,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    ),
  };
}; 