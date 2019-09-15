const AWS = require('aws-sdk');
const processResponse = require('./process-response').default;

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event) => {
  const deleteParams = {
    TableName: process.env.TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId,
    },
  };

  return dynamoDb.delete(deleteParams).promise()
    .then(() => processResponse(true, {}, 200))
    .catch((error) => {
      console.log(error);
      return processResponse(true, error, 400);
    });
};
