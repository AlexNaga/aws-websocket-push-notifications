const AWS = require('aws-sdk');

// Add ApiGatewayManagementApi to the AWS namespace
require('aws-sdk/clients/apigatewaymanagementapi');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { apiEndpoint, stage, wsClientsTable } = process.env;
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint: `${apiEndpoint}/${stage}`,
});

async function pushNotification(clientId, message) {
  try {
    return apiGatewayManagementApi.postToConnection({
      ConnectionId: clientId,
      Data: message,
    }).promise();
  } catch (errorPosting) {
    if (errorPosting.statusCode === 410) {
      console.log(`Found stale connection, deleting ${clientId}`);
      return dynamoDb.delete({
        TableName: `${wsClientsTable}-${stage}`,
        Key: { clientId },
      }).promise();
    }
    throw errorPosting;
  }
}

function processResponse(statusCode, data) {
  return { statusCode, body: JSON.stringify(data) };
}

exports.handler = async (event) => {
  const { action } = event.body;
  const bodyIsObj = typeof event.body === 'object';

  let message = event.body;
  if (bodyIsObj) {
    message = JSON.stringify(event.body.data);
  }

  if (action && action === 'sendMessage') {
    // TODO: Don't use scan, use query instead since we want to send to a specific user
    try {
      const result = await dynamoDb.scan({
        TableName: `${wsClientsTable}-${stage}`,
        ProjectionExpression: 'clientId',
      }).promise();
      const postCalls = result.Items.map(({ clientId }) => pushNotification(clientId, message));
      await Promise.all(postCalls);
      return processResponse(200, 'Data sent');
    } catch (err) {
      console.log(err);
      return processResponse(500, err.stack);
    }
  }
};
