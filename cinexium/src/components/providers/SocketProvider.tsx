'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';
import PusherClient from 'pusher-js';

interface SocketContextType {
  pusherClient: PusherClient | null;
  isConnected: boolean;
  hasUnreadMessages: boolean;
  clearUnreadMessages: () => void;
}

const SocketContext = createContext<SocketContextType>({
  pusherClient: null,
  isConnected: false,
  hasUnreadMessages: false,
  clearUnreadMessages: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  // Clear unread dot if user navigates to chat
  useEffect(() => {
    if (pathname?.startsWith('/chat')) {
      setHasUnreadMessages(false);
    }
  }, [pathname]);

  const clearUnreadMessages = () => setHasUnreadMessages(false);

  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    // Check for initial unread messages
    fetch('/api/chat/unread')
      .then(res => res.json())
      .then(data => {
        if (data.hasUnread && !window.location.pathname.startsWith('/chat')) {
          setHasUnreadMessages(true);
        }
      })
      .catch(console.error);

    const pusher = getPusherClient();
    if (!pusher) return;

    setPusherClient(pusher);
    setIsConnected(true);

    const channelName = `user-${userId}`;
    let channel = pusher.channel(channelName);
    
    if (!channel) {
      channel = pusher.subscribe(channelName);
    }

    const handleReceiveMessage = async (data: any) => {
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
    };

    const handleMessageUpdated = (data: any) => {
      if (data?.message) {
        if (!window.location.pathname.startsWith('/chat')) {
          setHasUnreadMessages(true);
        } else if (window.location.pathname === '/chat') {
           setHasUnreadMessages(true);
        }
      }
    };

    channel.bind('receiveMessage', handleReceiveMessage);
    channel.bind('messageUpdated', handleMessageUpdated);

    return () => {
      channel?.unbind('receiveMessage', handleReceiveMessage);
      channel?.unbind('messageUpdated', handleMessageUpdated);
    };
  }, [session]);

  return (
    <SocketContext.Provider value={{ pusherClient, isConnected, hasUnreadMessages, clearUnreadMessages }}>
      {children}
    </SocketContext.Provider>
  );
};
