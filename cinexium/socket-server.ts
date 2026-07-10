import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = 3001;

const io = new SocketIOServer(port, {
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

  // Handle chat messages over WebSocket
  socket.on('sendMessage', async (data: { senderId: string; targetUserId: string; content: string }) => {
    try {
      // 1. Check if block exists
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: data.senderId, blockedId: data.targetUserId },
            { blockerId: data.targetUserId, blockedId: data.senderId }
          ]
        }
      });
      if (block) return; // Cannot send message

      // 2. Get or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: data.senderId, user2Id: data.targetUserId },
            { user1Id: data.targetUserId, user2Id: data.senderId }
          ]
        }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { user1Id: data.senderId, user2Id: data.targetUserId }
        });
      }

      // Unhide conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { isHiddenByUser1: false, isHiddenByUser2: false }
      });

      // 3. Save message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: data.senderId,
          content: data.content
        }
      });

      // 4. Broadcast to target user AND back to sender
      console.log(`Saved & Relaying message to ${data.targetUserId}`);
      io.to(data.targetUserId).emit('receiveMessage', { message });
      socket.emit('messageSent', { message });
      
    } catch (e) {
      console.error('Socket sendMessage error:', e);
    }
  });

  // Edit Message
  socket.on('editMessage', async (data: { messageId: string; content: string; targetUserId: string }) => {
    try {
      const message = await prisma.message.update({
        where: { id: data.messageId },
        data: { content: data.content, isEdited: true }
      });
      io.to(data.targetUserId).emit('messageUpdated', { message });
      socket.emit('messageUpdated', { message });
    } catch (e) { console.error(e); }
  });

  // Delete Message for Everyone
  socket.on('deleteMessageForEveryone', async (data: { messageId: string; targetUserId: string }) => {
    try {
      const message = await prisma.message.update({
        where: { id: data.messageId },
        data: { isDeletedForEveryone: true, content: 'This message was deleted' },
        include: { reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      // Also delete reactions
      await prisma.messageReaction.deleteMany({ where: { messageId: data.messageId } });
      
      io.to(data.targetUserId).emit('messageUpdated', { message });
      socket.emit('messageUpdated', { message });
    } catch (e) { console.error(e); }
  });

  // React to Message
  socket.on('reactMessage', async (data: { messageId: string; reaction: string; targetUserId: string; userId: string }) => {
    try {
      await prisma.messageReaction.upsert({
        where: { messageId_userId: { messageId: data.messageId, userId: data.userId } },
        update: { emoji: data.reaction },
        create: { messageId: data.messageId, userId: data.userId, emoji: data.reaction }
      });

      const message = await prisma.message.findUnique({
        where: { id: data.messageId },
        include: { reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      
      if (message) {
        io.to(data.targetUserId).emit('messageUpdated', { message });
        socket.emit('messageUpdated', { message });
      }
    } catch (e) { console.error(e); }
  });

  // ================= GROUP CHAT =================

  // Join a group room
  socket.on('joinGroup', (groupId: string) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group ${groupId}`);
  });

  // Send Group Message
  socket.on('sendGroupMessage', async (data: { groupId: string; senderId: string; content: string }) => {
    try {
      const message = await prisma.groupMessage.create({
        data: {
          groupId: data.groupId,
          senderId: data.senderId,
          content: data.content
        },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: true }
      });
      io.to(`group_${data.groupId}`).emit('receiveGroupMessage', { message });
    } catch (e) { console.error(e); }
  });

  // Edit Group Message
  socket.on('editGroupMessage', async (data: { messageId: string; groupId: string; content: string }) => {
    try {
      const message = await prisma.groupMessage.update({
        where: { id: data.messageId },
        data: { content: data.content, isEdited: true },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: true }
      });
      io.to(`group_${data.groupId}`).emit('groupMessageUpdated', { message });
    } catch (e) { console.error(e); }
  });

  // Delete Group Message
  socket.on('deleteGroupMessage', async (data: { messageId: string; groupId: string }) => {
    try {
      const message = await prisma.groupMessage.update({
        where: { id: data.messageId },
        data: { isDeletedForEveryone: true, content: 'This message was deleted' },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: true }
      });
      await prisma.groupMessageReaction.deleteMany({ where: { messageId: data.messageId } });
      io.to(`group_${data.groupId}`).emit('groupMessageUpdated', { message });
    } catch (e) { console.error(e); }
  });

  // React to Group Message
  socket.on('reactGroupMessage', async (data: { messageId: string; groupId: string; reaction: string; userId: string }) => {
    try {
      await prisma.groupMessageReaction.upsert({
        where: { messageId_userId: { messageId: data.messageId, userId: data.userId } },
        update: { emoji: data.reaction },
        create: { messageId: data.messageId, userId: data.userId, emoji: data.reaction }
      });
      const message = await prisma.groupMessage.findUnique({
        where: { id: data.messageId },
        include: { sender: { select: { id: true, username: true, name: true, avatar: true } }, reactions: { include: { user: { select: { id: true, name: true, username: true, avatar: true } } } } }
      });
      if (message) {
        io.to(`group_${data.groupId}`).emit('groupMessageUpdated', { message });
      }
    } catch (e) { console.error(e); }
  });  socket.on('disconnect', () => {
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

console.log(`> Socket.IO Server ready on ws://localhost:${port}`);
