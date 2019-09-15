const AWS = require('aws-sdk');
const parseDynamoDBNewImageEvent = require('./parse-dynamodb-new-image-event');

// Add ApiGatewayManagementApi to the AWS namespace
require('aws-sdk/clients/apigatewaymanagementapi');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { CONNECTIONS_TABLE_NAME, STAGE_NAME, DOMAIN_NAME } = process.env;
const apigwManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: `${DOMAIN_NAME}/${STAGE_NAME}`,
});

function pushNotification(connectionId, notificationData) {
  return apigwManagementApi.postToConnection({
    ConnectionId: connectionId, Data: JSON.stringify(notificationData),
  }).promise()
    .catch((errorPosting) => {
      if (errorPosting.statusCode === 410) {
        console.log(`Found stale connection, deleting ${connectionId}`);
        return dynamoDb.delete({
          TableName: CONNECTIONS_TABLE_NAME, Key: { connectionId },
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
  return dynamoDb.scan({
    TableName: CONNECTIONS_TABLE_NAME, ProjectionExpression: 'connectionId',
  }).promise()
    .then((result) => {
      const postCalls = result.Items.map(({ connectionId }) => pushNotification(connectionId, newEvents));
      return Promise.all(postCalls);
    }).then(() => processResponse(200, 'Data sent'))
    .catch((err) => {
      console.log(err);
      return processResponse(500, err.stack);
    });
};
