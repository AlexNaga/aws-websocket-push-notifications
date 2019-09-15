const AWS = require('aws-sdk');
const processResponse = require('./process-response').default.default;

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event) => {
  const connection = {
    TableName: process.env.TABLE_NAME,
    Item: {
      connectionId: event.requestContext.connectionId,
    },
  };

  return dynamoDb.put(connection).promise()
    .then((response) => processResponse(true, {}, 201))
    .catch((error) => {
      console.log(error);
      return processResponse(true, error, 400);
    });
};
