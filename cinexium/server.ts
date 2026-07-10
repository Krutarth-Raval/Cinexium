import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track connected users: userId -> socketId
  const userSockets = new Map<string, string>();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register a user's socket
    socket.on('register', (userId: string) => {
      userSockets.set(userId, socket.id);
      socket.join(userId); // Join a room named after their userId for easier targeting
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Handle sending a notification
    socket.on('sendNotification', (data: { targetUserId: string; type: string; actor: any }) => {
      console.log(`Relaying notification to ${data.targetUserId}`);
      // Emit to the specific user's room
      io.to(data.targetUserId).emit('receiveNotification', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Clean up mapping
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
