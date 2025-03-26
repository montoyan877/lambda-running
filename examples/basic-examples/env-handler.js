/**
 * Example Lambda handler that uses environment variables
 */

// Handler function that returns environment information
exports.handler = async (event, context) => {
  // Get environment variables
  const environment = {
    aws: {
      region: process.env.AWS_REGION || 'not-set',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'set (value hidden)' : 'not-set',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'set (value hidden)' : 'not-set',
    },
    database: {
      host: process.env.DB_HOST || 'not-set',
      port: process.env.DB_PORT || 'not-set',
      name: process.env.DB_NAME || 'not-set',
      user: process.env.DB_USER || 'not-set',
      password: process.env.DB_PASSWORD ? 'set (value hidden)' : 'not-set',
    },
    app: {
      debug: process.env.APP_DEBUG || 'not-set',
      logLevel: process.env.APP_LOG_LEVEL || 'not-set',
      secret: process.env.APP_SECRET ? 'set (value hidden)' : 'not-set',
    },
    services: {
      apiEndpoint: process.env.API_ENDPOINT || 'not-set',
      apiKey: process.env.API_KEY ? 'set (value hidden)' : 'not-set',
    },
    lambda: {
      functionName: context.functionName,
      awsRequestId: context.awsRequestId,
      memoryLimitInMB: context.memoryLimitInMB,
      remainingTime: context.getRemainingTimeInMillis(),
    },
  };

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Environment information retrieved successfully',
        environment,
        event,
      },
      null,
      2
    ),
  };
};
