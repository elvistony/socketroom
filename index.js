const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, 
    {
  cors: {
    origin: ['http://localhost:5500','http://192.168.0.157:5500','http://localhost:5800', 'https://elvistony.dev', /\.elvistony\.dev$/],
    methods: ['GET', 'POST']
  }
}
);

// Store connected clients and their IDs
const roomOf = {};
const rooms = {};
const roomStorage = {}
// let nextClientId = 1; // Initialize client ID counter

// Serve the public folder (if needed)
app.use(express.static('public'));

// Handle socket connections
io.on('connection', (socket) => {

    let clientId = socket.id;
    console.log('A user connected');

    // Handle joining a room
    socket.on('join', (roomId) => {
        socket.join(roomId);
        console.log(`Client ${clientId} joined room: ${roomId}`);
        const room = io.sockets.adapter.rooms[roomId];
        var numPeers = room ? room.size : 0;  // Check if the room exists and count peers

        if(roomId in rooms){
            rooms[roomId].push(clientId);
            numPeers = rooms[roomId].length;
            
        }else{
            rooms[roomId] = [clientId];
            numPeers = 0
        }
        // console.log(rooms)

        roomOf[socket.id]=roomId;

        socket.emit('welcome', {
            from:'system',
            msg:{
                type:'your-id',
                id:clientId,
                count: numPeers,
                context: (roomId in roomStorage)?roomStorage[roomId]:false
            },
            room:roomId,
        });

        // Notify other clients in the room
        
        socket.to(roomId).emit('roomupdate', {
            from:'system',
            msg:{
                type:'new-client',
                id:clientId,
                count:numPeers
            },
            room:roomId
        });
    });

    // Handle sending messages
    socket.on('message', (data) => {
        const { from, msg, room } = data;
        // console.log(data)
        // Broadcast the message to all clients in the room
        io.to(room).emit('message', {
            from: socket.id, // Get the client ID from the mapping
            msg: msg,
            room: room
        });

        // console.log(`Message from ${from} in room ${room}: ${msg}`);
    });

    // Handle sending a targeted message
    socket.on('direct', (data) => {
        const { targetClientId, message } = data;

        // Find the socket ID of the target client
        const targetSocketId = Object.keys(roomOf).find(key => roomOf[key] === targetClientId);

        if (targetSocketId) {
            io.to(targetSocketId).emit('message', {
                from: socket.id, // Sender's ID
                msg: message,
                room: roomId
            });

            // console.log(`Private message from ${socket.id} to ${targetClientId}: ${message}`);
        } else {
            socket.emit('error', { message: `Client with ID ${targetClientId} not found.` });
        }
    });


    // Handle 'peers' event to return the number of peers in the room
    socket.on('peers', (data) => {
        const { from, msg , roomId } = data
        try{
            socket.emit('clients', {
                from:'system',
                clients: rooms[roomId],
                count: rooms[roomId].length
            });
        }catch (e){
            console.log("Error",e)
        } 
    });

    // Handle 'peers' event to return the number of peers in the room
    socket.on('getContext', (data) => {
        const { from, msg , roomId } = data
        socket.emit('context', {
            from: 'system', // Sender's ID
            context: roomStorage[roomId],
            room: roomId
        });
        console.log('getContext',context,roomId)
    });

    socket.on('storeContext', (data) => {
        const { from, context, roomId } = data
        roomStorage[roomId] = context;
        socket.to(roomId).emit('context', {
            from:from,
            context: roomStorage[roomId]
        });  // Send back the number of peers to the requesting client
        console.log('storeContext',context)
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        
        console.log(`A ${socket.id} disconnected`);
        
        roomId = roomOf[socket.id]
        // Notify other clients in the room
        

        if(socket.id in roomOf){
            roomId = roomOf[socket.id]

            const room = io.sockets.adapter.rooms[roomId];
            var numPeers = room ? room.size : 0;  // Check if the room exists and count peers  
            if(roomId in rooms){
                numPeers = rooms[roomId].length;
            }  
            

            if(rooms[roomId]==[socket.id]){
                // console.log('Was last viewer so deleting room')
                delete rooms[roomId]
                delete roomStorage[roomId]
            }else{
                // console.log('Need to remote ',socket.id,' from ',roomId, rooms[roomId])
                rooms[roomId] = rooms[roomId].filter(function(item) {
                    return item !== socket.id
                })
            }

            delete roomOf[socket.id];
            socket.to(roomId).emit('roomupdate', {
                from:'system',
                msg:{
                    type:'left-client',
                    id:socket.id,
                    count:numPeers-1
                },
                room:roomId
            });
            // console.log('User left and room cleared')
        }else{
            // console.log('User left without joining a room')
        }

        
        
    });
});

// Start the server
const PORT = process.env.PORT || 5800;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
