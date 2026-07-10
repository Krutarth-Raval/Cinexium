'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';

export const NotificationBell = ({ isMobile = false }: { isMobile?: boolean }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      fetchNotifications();
    };

    socket.on('receiveNotification', handleNewNotification);

    return () => {
      socket.off('receiveNotification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = () => {
    if (isMobile) {
      router.push('/notifications');
      return;
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      markAsRead();
    }
  };

  const handleRequest = async (notificationId: string, actorId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/notifications/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, actorId })
      });
      if (res.ok) {
        if (action === 'accept' && socket) {
          socket.emit('sendNotification', {
            targetUserId: actorId,
            type: 'REQUEST_ACCEPTED',
            actor: { username: 'Someone' } 
          });
        }
        fetchNotifications();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFollowBack = async (username: string) => {
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (socket && data.targetUserId && data.status !== 'NONE') {
          socket.emit('sendNotification', {
            targetUserId: data.targetUserId,
            type: data.status === 'PENDING' ? 'FOLLOW_REQUEST' : 'FOLLOW',
            actor: { username }
          });
        }
        fetchNotifications();
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <>
      <button 
        onClick={handleToggle}
        className="relative p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Desktop Drawer Backdrop */}
      {isOpen && !isMobile && (
        <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setIsOpen(false)} />
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <div className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-[#1a1d24] border-l border-white/10 shadow-2xl z-[105] flex flex-col transform transition-transform duration-300 ease-in-out pt-24 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-3 border-b border-white/10 font-medium text-white flex justify-between items-center">
            Notifications
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 items-start relative group">
                  <button 
                    onClick={() => handleDelete(n.id)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete notification"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>

                  <Link href={`/profile/${n.actor.username}`} onClick={() => setIsOpen(false)}>
                    {n.actor.avatar ? (
                      <img src={n.actor.avatar} alt={n.actor.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center text-white font-bold">
                        {n.actor.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 text-sm pr-4">
                    <Link href={`/profile/${n.actor.username}`} className="font-semibold text-white hover:underline" onClick={() => setIsOpen(false)}>
                      {n.actor.username}
                    </Link>
                    {' '}
                    <span className="text-gray-300">
                      {n.type === 'FOLLOW' && 'started following you.'}
                      {n.type === 'REQUEST_ACCEPTED' && 'accepted your follow request.'}
                      {n.type === 'FOLLOW_REQUEST' && 'requested to follow you.'}
                    </span>
                    
                    {n.type === 'FOLLOW_REQUEST' && (
                      <div className="mt-2 flex gap-2">
                        <button 
                          onClick={() => handleRequest(n.id, n.actor.id, 'accept')}
                          className="flex-1 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs font-medium"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleRequest(n.id, n.actor.id, 'reject')}
                          className="flex-1 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {(n.type === 'FOLLOW' || n.type === 'REQUEST_ACCEPTED') && (
                      <div className="mt-2">
                        {!n.isFollowing ? (
                          n.isFollowRequested ? (
                            <button 
                              onClick={() => handleFollowBack(n.actor.username)}
                              className="py-1 px-3 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-medium"
                            >
                              Requested
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleFollowBack(n.actor.username)}
                              className="py-1 px-3 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs font-medium"
                            >
                              Follow Back
                            </button>
                          )
                        ) : (
                          <Link 
                            href={`/chat/${n.actor.username}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-block py-1 px-4 bg-[#252a34] hover:bg-[#323844] border border-white/10 text-white rounded text-xs font-medium"
                          >
                            Message
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};
