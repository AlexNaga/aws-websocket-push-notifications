const AWS = require('aws-sdk');
const processResponse = require('./processResponse');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { stage, wsClientsTable } = process.env;

exports.handler = (event) => {
  const deleteParams = {
    TableName: `${wsClientsTable}-${stage}`,
    Key: {
      clientId: event.requestContext.connectionId,
    },
  };

  return dynamoDb.delete(deleteParams).promise()
    .then(() => processResponse(true, {}, 200))
    .catch((error) => {
      console.log(error);
      return processResponse(true, error, 400);
    });
};
