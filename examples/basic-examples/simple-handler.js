exports.handler = async () => {
  let message = 'Hello, world!';
  console.log(message);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello, world!' }),
  };
};
