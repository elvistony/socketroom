const socket = io();

// Join a room
function joinRoom() {
  const roomId = document.getElementById('roomInput').value;
  socket.emit('joinRoom', roomId);
}

// Send message to the room
function sendMessage() {
  const roomId = document.getElementById('roomInput').value;
  const message = document.getElementById('messageInput').value;
  socket.emit('message', { roomId, message });
}

// Listen for messages and display them
socket.on('message', (message) => {
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messagesDiv.appendChild(messageElement);
});
