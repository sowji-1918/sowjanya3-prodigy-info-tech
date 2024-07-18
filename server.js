const express = require('express');
const { WebSocketServer } = require('ws');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store messages for each room
const rooms = {};

// WebSocket connection
wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === 'join') {
      currentRoom = parsedMessage.room;
      ws.room = currentRoom; // Save room in WebSocket connection

      if (!rooms[currentRoom]) {
        rooms[currentRoom] = [];
      }
      ws.send(JSON.stringify({ type: 'history', messages: rooms[currentRoom] }));
    } else if (parsedMessage.type === 'message') {
      if (currentRoom) {
        const msg = { user: parsedMessage.user, text: parsedMessage.text };
        rooms[currentRoom].push(msg);
        wss.clients.forEach((client) => {
          if (client.readyState === ws.OPEN && client.room === currentRoom) {
            client.send(JSON.stringify({ type: 'message', message: msg }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
