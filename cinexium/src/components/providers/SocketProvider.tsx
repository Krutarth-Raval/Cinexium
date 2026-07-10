'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  hasUnreadMessages: boolean;
  clearUnreadMessages: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  hasUnreadMessages: false,
  clearUnreadMessages: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Clear unread dot if user navigates to chat
  useEffect(() => {
    if (pathname?.startsWith('/chat')) {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

  const clearUnreadMessages = () => setHasUnreadMessages(false);

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    // Only connect if there's a logged-in user with an ID
    if (!userId) return;

    // Connect to the socket server (which runs on port 3001 locally, or same origin in prod)
    const socketUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:3001';
    
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Register the user with their ID
      socketInstance.emit('register', userId);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('receiveMessage', async (data: any) => {
      // Show unread dot if we are not currently in the chat with this user
      if (data?.message?.senderId) {
        if (!window.location.pathname.startsWith('/chat')) {
          setHasUnreadMessages(true);
        } else {
          try {
            const res = await fetch(`/api/users/byId/${data.message.senderId}`);
            if (res.ok) {
              const sender = await res.json();
              if (sender && sender.username && !window.location.pathname.includes(`/chat/${sender.username}`)) {
                setHasUnreadMessages(true);
              }
            }
          } catch (e) {}
        }
      }
    });

    socketInstance.on('messageUpdated', async (data: any) => {
      if (data?.message) {
        if (!window.location.pathname.startsWith('/chat')) {
          setHasUnreadMessages(true);
        } else {
          try {
            // Find the other user's username
            const otherUserId = data.message.senderId === userId ? data.message.conversationId : data.message.senderId;
            // It's hard to get username synchronously without fetch, so we just check if it's the current chat
            // If they are in /chat list, show dot if they receive update
            if (window.location.pathname === '/chat') {
               setHasUnreadMessages(true);
            }
          } catch (e) {}
        }
      }
    });

    socketInstance.on('receiveGroupMessage', async (data: any) => {
      if (!window.location.pathname.includes(`/chat/group/${data?.message?.groupId}`)) {
        setHasUnreadMessages(true);
      }
    });

    socketInstance.on('groupMessageUpdated', async (data: any) => {
      if (!window.location.pathname.includes(`/chat/group/${data?.message?.groupId}`)) {
        setHasUnreadMessages(true);
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [session]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, hasUnreadMessages, clearUnreadMessages }}>
      {children}
    </SocketContext.Provider>
  );
};
