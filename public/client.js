const socket = io('http://localhost:5800');
let selfId = '';
let room = '';

// Join a room
function joinRoom() {
  const roomId = document.getElementById('roomInput').value;
  room = roomId;
  socket.emit('join', roomId);
}

// Send message to the room
function sendMessage() {
  const roomId = document.getElementById('roomInput').value;
  const message = document.getElementById('messageInput').value;
  socket.emit('message', { from:selfId,message:message, room:roomId });
}

// Send message to the room
function sendDirect(peer,message) {
  socket.emit('direct', { targetClientId:peer, message:message });
}

socket.on('welcome',(data)=>{
  selfId = data.msg.id;
})

// Listen for messages and display them
socket.on('message', (data) => {
  console.log(data);
  const { roomId, message } = data;
  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messagesDiv.appendChild(messageElement);
});
