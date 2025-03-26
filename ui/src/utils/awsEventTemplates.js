/**
 * AWS Lambda Test Event Templates
 * Contains predefined templates similar to those in the AWS Console
 */

// Icons for different services
const ICONS = {
  API_GATEWAY: {
    color: 'text-blue-400',
    path: 'M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z'
  },
  CLOUDFRONT: {
    color: 'text-purple-400',
    path: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z'
  },
  DYNAMODB: {
    color: 'text-yellow-500',
    path: 'M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z'
  },
  S3: {
    color: 'text-red-400',
    paths: [
      'M4 3a2 2 0 100 4h12a2 2 0 100-4H4z',
      'M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z'
    ]
  },
  MESSAGING: {
    color: 'text-green-400',
    paths: [
      'M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z',
      'M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z'
    ]
  },
  EVENTBRIDGE: {
    color: 'text-cyan-400',
    path: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z'
  },
  DEFAULT: {
    color: 'text-orange-400',
    path: 'M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z'
  }
};

export const AWS_EVENT_TEMPLATES = [
  {
    name: 'API Gateway AWS Proxy',
    category: 'AWS',
    icon: ICONS.API_GATEWAY,
    data: {
      body: "eyJ0ZXN0IjoiYm9keSJ9",
      resource: "/{proxy+}",
      path: "/path/to/resource",
      httpMethod: "POST",
      isBase64Encoded: true,
      queryStringParameters: {
        foo: "bar"
      },
      multiValueQueryStringParameters: {
        foo: ["bar"]
      },
      pathParameters: {
        proxy: "path/to/resource"
      },
      stageVariables: {
        baz: "qux"
      },
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, sdch",
        "Accept-Language": "en-US,en;q=0.8",
        "Cache-Control": "max-age=0",
        "CloudFront-Forwarded-Proto": "https",
        "CloudFront-Is-Desktop-Viewer": "true",
        "CloudFront-Is-Mobile-Viewer": "false",
        "CloudFront-Is-SmartTV-Viewer": "false",
        "CloudFront-Is-Tablet-Viewer": "false",
        "CloudFront-Viewer-Country": "US",
        "Host": "1234567890.execute-api.us-east-1.amazonaws.com",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Custom User Agent String",
        "Via": "1.1 08f323deadbeefa7af34d5feb414ce27.cloudfront.net (CloudFront)",
        "X-Amz-Cf-Id": "cDehVQoZnx43VYQb9j2-nvCh-9z396Uhbp027Y2JvkCPNLmGJHqlaA==",
        "X-Forwarded-For": "127.0.0.1, 127.0.0.2",
        "X-Forwarded-Port": "443",
        "X-Forwarded-Proto": "https"
      },
      multiValueHeaders: {
        "Accept": ["text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"],
        "Accept-Encoding": ["gzip, deflate, sdch"],
        "X-Forwarded-For": ["127.0.0.1, 127.0.0.2"]
      },
      requestContext: {
        accountId: "123456789012",
        resourceId: "123456",
        stage: "prod",
        requestId: "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
        requestTime: "09/Apr/2015:12:34:56 +0000",
        requestTimeEpoch: 1428582896000,
        identity: {
          cognitoIdentityPoolId: null,
          accountId: null,
          cognitoIdentityId: null,
          caller: null,
          accessKey: null,
          sourceIp: "127.0.0.1",
          cognitoAuthenticationType: null,
          cognitoAuthenticationProvider: null,
          userArn: null,
          userAgent: "Custom User Agent String",
          user: null
        },
        path: "/prod/path/to/resource",
        resourcePath: "/{proxy+}",
        httpMethod: "POST",
        apiId: "1234567890",
        protocol: "HTTP/1.1"
      }
    }
  },
  {
    name: 'API Gateway Authorizer',
    category: 'AWS',
    icon: ICONS.API_GATEWAY,
    data: {
      type: "TOKEN",
      methodArn: "arn:aws:execute-api:us-east-1:123456789012:1234567890/prod/GET/request",
      authorizationToken: "allow"
    }
  },
  {
    name: 'API Gateway HTTP API',
    category: 'AWS',
    icon: ICONS.API_GATEWAY,
    data: {
      version: "2.0",
      routeKey: "ANY /pets",
      rawPath: "/pets",
      rawQueryString: "species=dog",
      headers: {
        "Header1": "value1",
        "Header2": "value2"
      },
      queryStringParameters: {
        "species": "dog"
      },
      cookies: [
        "cookie1",
        "cookie2"
      ],
      requestContext: {
        accountId: "123456789012",
        apiId: "api-id",
        domainName: "id.execute-api.us-east-1.amazonaws.com",
        domainPrefix: "id",
        http: {
          method: "GET",
          path: "/pets",
          protocol: "HTTP/1.1",
          sourceIp: "IP",
          userAgent: "agent"
        },
        requestId: "id",
        routeKey: "ANY /pets",
        stage: "$default",
        time: "12/Mar/2020:19:03:58 +0000",
        timeEpoch: 1583348638390
      },
      body: "Hello from Lambda",
      pathParameters: {
        "species": "dog"
      },
      isBase64Encoded: false,
      stageVariables: {
        "stageVariable1": "value1",
        "stageVariable2": "value2"
      }
    }
  },
  {
    name: 'CloudFront A/B Test',
    category: 'AWS',
    icon: ICONS.CLOUDFRONT,
    data: {
      Records: [
        {
          cf: {
            config: {
              distributionDomainName: "d111111abcdef8.cloudfront.net",
              distributionId: "EDFDVBD6EXAMPLE",
              eventType: "viewer-request",
              requestId: "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
            },
            request: {
              clientIp: "203.0.113.178",
              headers: {
                host: [
                  {
                    key: "Host",
                    value: "d111111abcdef8.cloudfront.net"
                  }
                ],
                "user-agent": [
                  {
                    key: "User-Agent",
                    value: "curl/7.66.0"
                  }
                ],
                accept: [
                  {
                    key: "accept",
                    value: "*/*"
                  }
                ]
              },
              method: "GET",
              querystring: "",
              uri: "/experiment-pixel.jpg"
            }
          }
        }
      ]
    }
  },
  {
    name: 'CloudFront Access Request in Response',
    category: 'AWS',
    icon: ICONS.CLOUDFRONT,
    data: {
      Records: [
        {
          cf: {
            config: {
              distributionDomainName: "d111111abcdef8.cloudfront.net",
              distributionId: "EDFDVBD6EXAMPLE",
              eventType: "origin-response",
              requestId: "4TyzHTaYWb1GX1qTfsHhEqV6HUDd_BzoBZnwfnvQc_1oF26ClkoUSEQ=="
            },
            request: {
              clientIp: "203.0.113.178",
              headers: {
                host: [
                  {
                    key: "Host",
                    value: "d111111abcdef8.cloudfront.net"
                  }
                ],
                "user-agent": [
                  {
                    key: "User-Agent",
                    value: "curl/7.66.0"
                  }
                ]
              },
              method: "GET",
              querystring: "",
              uri: "/media/index.mpd"
            },
            response: {
              headers: {
                "access-control-allow-origin": [
                  {
                    key: "Access-Control-Allow-Origin",
                    value: "*"
                  }
                ],
                "content-type": [
                  {
                    key: "Content-Type",
                    value: "application/dash+xml"
                  }
                ]
              },
              status: "200",
              statusDescription: "OK"
            }
          }
        }
      ]
    }
  },
  {
    name: 'DynamoDB Update',
    category: 'AWS',
    icon: ICONS.DYNAMODB,
    data: {
      Records: [
        {
          eventID: "1",
          eventVersion: "1.0",
          dynamodb: {
            Keys: {
              Id: {
                N: "101"
              }
            },
            NewImage: {
              Message: {
                S: "New item!"
              },
              Id: {
                N: "101"
              }
            },
            StreamViewType: "NEW_AND_OLD_IMAGES",
            SequenceNumber: "111",
            SizeBytes: 26
          },
          awsRegion: "us-west-2",
          eventName: "INSERT",
          eventSourceARN: "arn:aws:dynamodb:us-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
          eventSource: "aws:dynamodb"
        },
        {
          eventID: "2",
          eventVersion: "1.0",
          dynamodb: {
            OldImage: {
              Message: {
                S: "New item!"
              },
              Id: {
                N: "101"
              }
            },
            NewImage: {
              Message: {
                S: "This item has changed"
              },
              Id: {
                N: "101"
              }
            },
            StreamViewType: "NEW_AND_OLD_IMAGES",
            SequenceNumber: "222",
            SizeBytes: 59
          },
          awsRegion: "us-west-2",
          eventName: "MODIFY",
          eventSourceARN: "arn:aws:dynamodb:us-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
          eventSource: "aws:dynamodb"
        }
      ]
    }
  },
  {
    name: 'S3 Put',
    category: 'AWS',
    icon: ICONS.S3,
    data: {
      Records: [
        {
          eventVersion: "2.0",
          eventSource: "aws:s3",
          awsRegion: "us-east-1",
          eventTime: "1970-01-01T00:00:00.000Z",
          eventName: "ObjectCreated:Put",
          userIdentity: {
            principalId: "EXAMPLE"
          },
          requestParameters: {
            sourceIPAddress: "127.0.0.1"
          },
          responseElements: {
            "x-amz-request-id": "EXAMPLE123456789",
            "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH"
          },
          s3: {
            s3SchemaVersion: "1.0",
            configurationId: "testConfigRule",
            bucket: {
              name: "my-s3-bucket",
              ownerIdentity: {
                principalId: "EXAMPLE"
              },
              arn: "arn:aws:s3:::mybucket"
            },
            object: {
              key: "HappyFace.jpg",
              size: 1024,
              eTag: "0123456789abcdef0123456789abcdef",
              sequencer: "0A1B2C3D4E5F678901"
            }
          }
        }
      ]
    }
  },
  {
    name: 'SQS',
    category: 'AWS',
    icon: ICONS.MESSAGING,
    data: {
      Records: [
        {
          messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
          receiptHandle: "MessageReceiptHandle",
          body: "Hello from SQS!",
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "1523232000000",
            SenderId: "123456789012",
            ApproximateFirstReceiveTimestamp: "1523232000001"
          },
          messageAttributes: {},
          md5OfBody: "7b270e59b47ff90a553787216d55d91d",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:MyQueue",
          awsRegion: "us-east-1"
        }
      ]
    }
  },
  {
    name: 'SNS',
    category: 'AWS',
    icon: ICONS.MESSAGING,
    data: {
      Records: [
        {
          EventVersion: "1.0",
          EventSubscriptionArn: "arn:aws:sns:us-east-1:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
          EventSource: "aws:sns",
          Sns: {
            SignatureVersion: "1",
            Timestamp: "2019-01-02T12:45:07.000Z",
            Signature: "tcc6faL2yUC6dgZdmrwh1Y4cGa/ebXEkAi6RibDsvpi+tE/1+82j...65r==",
            SigningCertUrl: "https://sns.us-east-1.amazonaws.com/SimpleNotificationService-ac565b8b1a6c5d002d285f9598aa1d9b.pem",
            MessageId: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
            Message: "Hello from SNS!",
            MessageAttributes: {
              Test: {
                Type: "String",
                Value: "TestString"
              },
              TestBinary: {
                Type: "Binary",
                Value: "TestBinary"
              }
            },
            Type: "Notification",
            UnsubscribeUrl: "https://sns.us-east-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-east-1:123456789012:test-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",
            TopicArn: "arn:aws:sns:us-east-1:123456789012:sns-lambda",
            Subject: "TestInvoke"
          }
        }
      ]
    }
  },
  {
    name: 'EventBridge',
    category: 'AWS',
    icon: ICONS.EVENTBRIDGE,
    data: {
      version: "0",
      id: "6a7e8feb-b491-4cf7-a9f1-bf3703467718",
      "detail-type": "EC2 Instance State-change Notification",
      source: "aws.ec2",
      account: "111122223333",
      time: "2017-12-22T18:43:48Z",
      region: "us-west-1",
      resources: [
        "arn:aws:ec2:us-west-1:123456789012:instance/i-1234567890abcdef0"
      ],
      detail: {
        instanceId: "i-1234567890abcdef0",
        state: "terminated"
      }
    }
  }
]; 