const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost', 'https://elvistony.dev', /\.elvistony\.dev$/],
    methods: ['GET', 'POST']
  }
});

// Serve the public folder (if needed)
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle joining a room
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Handle sending messages
  socket.on('message', ({ roomId, message }) => {
    io.to(roomId).emit('message', message);  // Broadcast message to the room
  });

  // Handle 'peers' event to return the number of peers in the room
  socket.on('peers', (roomId) => {
    const room = io.sockets.adapter.rooms[roomId];
    const numPeers = room ? room.size : 0;  // Check if the room exists and count peers
    socket.emit('peers', numPeers);  // Send back the number of peers to the requesting client
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 5800;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
