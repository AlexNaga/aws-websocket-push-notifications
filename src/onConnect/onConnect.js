const AWS = require('aws-sdk');
const processResponse = require('./processResponse');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = (event) => {
  const connection = {
    TableName: process.env.wsClientsTable,
    Item: {
      clientId: event.requestContext.connectionId,
    },
  };

  return dynamoDb.put(connection).promise()
    .then(() => processResponse(true, {}, 201))
    .catch((error) => {
      console.log(error);
      return processResponse(true, error, 400);
    });
};
