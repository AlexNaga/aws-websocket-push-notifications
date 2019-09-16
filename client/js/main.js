// Create WebSocket connection.
const url = 'wss://lbqq8qxq96.execute-api.eu-west-1.amazonaws.com/test';
const socket = new WebSocket(url);

// Connection opened
socket.addEventListener('open', (event) => {
  socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', (event) => {
  console.log('Message from server ', event.data);
});


const submitBtn = document.querySelector('.wsSubmitBtn');

submitBtn.addEventListener('click', (event) => {
  const input = document.querySelector('.wsInput').value;
  socket.send(input);
});
