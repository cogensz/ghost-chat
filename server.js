const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// In-Memory ephemeral store: zero persistent retention
// rooms: Map<roomId, Map<socketId, { id, nickname, color, joinedAt }>>
const rooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentUser = null;

    socket.on('join-room', ({ roomId, nickname, color }) => {
      if (!roomId || !nickname) return;

      currentRoom = roomId;
      currentUser = {
        id: socket.id,
        nickname: nickname.trim(),
        color: color || '#a855f7',
        joinedAt: Date.now(),
      };

      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
      }
      const roomMap = rooms.get(roomId);
      roomMap.set(socket.id, currentUser);

      // Send current users in the room
      const userList = Array.from(roomMap.values());
      io.to(roomId).emit('room-users', userList);

      // Notify others in room
      socket.to(roomId).emit('user-joined', {
        id: 'sys-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        system: true,
        text: `${currentUser.nickname} joined the secure channel`,
        timestamp: Date.now(),
      });
    });

    socket.on('send-message', (messageData) => {
      if (!currentRoom || !messageData || !messageData.text) return;
      
      const payload = {
        id: messageData.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        text: messageData.text.trim(),
        senderId: socket.id,
        senderName: currentUser ? currentUser.nickname : 'Anonymous',
        senderColor: currentUser ? currentUser.color : '#a855f7',
        timestamp: Date.now(),
      };

      // Broadcast to everyone in the room (including sender or to peers)
      io.to(currentRoom).emit('new-message', payload);
    });

    socket.on('typing', ({ isTyping }) => {
      if (!currentRoom || !currentUser) return;
      socket.to(currentRoom).emit('user-typing', {
        nickname: currentUser.nickname,
        senderId: socket.id,
        isTyping,
      });
    });

    const handleLeave = () => {
      if (!currentRoom || !rooms.has(currentRoom)) return;

      const roomMap = rooms.get(currentRoom);
      if (roomMap.has(socket.id)) {
        const leavingUser = roomMap.get(socket.id);
        roomMap.delete(socket.id);

        // Notify peers
        socket.to(currentRoom).emit('user-left', {
          id: 'sys-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          system: true,
          text: `${leavingUser.nickname} left the channel`,
          timestamp: Date.now(),
        });

        // If no users left, purge room completely from memory
        if (roomMap.size === 0) {
          rooms.delete(currentRoom);
          console.log(`[Ephemeral] Room ${currentRoom} empty, purged all in-memory traces.`);
        } else {
          io.to(currentRoom).emit('room-users', Array.from(roomMap.values()));
        }
      }
    };

    socket.on('leave-room', () => {
      handleLeave();
      socket.leave(currentRoom);
      currentRoom = null;
    });

    socket.on('disconnect', () => {
      handleLeave();
    });
  });

  httpServer.listen(port, () => {
    console.log(`> GhostChat ephemeral server ready on http://${hostname}:${port}`);
  });
});
