const AWS = require('aws-sdk');
const parseDynamoDBNewImageEvent = require('./parseDynamodbNewImageEvent');

// Add ApiGatewayManagementApi to the AWS namespace
require('aws-sdk/clients/apigatewaymanagementapi');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { wsClientsTable, stage, apiEndpoint } = process.env;
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: `${apiEndpoint}/${stage}`,
});

function pushNotification(clientId, notificationData) {
  return apigwManagementApi.postToConnection({
    ConnectionId: clientId, Data: JSON.stringify(notificationData),
  }).promise()
    .catch((errorPosting) => {
      if (errorPosting.statusCode === 410) {
        console.log(`Found stale connection, deleting ${clientId}`);
        return dynamoDb.delete({
          TableName: wsClientsTable, Key: { clientId },
        }).promise();
      }

      throw errorPosting;
    });
}

function processResponse(statusCode, data) {
  return { statusCode, body: JSON.stringify(data) };
}

exports.handler = (event) => {
  const newEvents = parseDynamoDBNewImageEvent(event);

  // TODO: Don't use scan, use query instead
  return dynamoDb.scan({
    TableName: wsClientsTable, ProjectionExpression: 'clientId',
  }).promise()
    .then((result) => {
      const postCalls = result.Items.map(({ clientId }) => pushNotification(clientId, newEvents));
      return Promise.all(postCalls);
    }).then(() => processResponse(200, 'Data sent'))
    .catch((err) => {
      console.log(err);
      return processResponse(500, err.stack);
    });
};
