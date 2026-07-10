'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
    markAsRead();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = () => fetchNotifications();
    socket.on('receiveNotification', handleNewNotification);
    return () => {
      socket.off('receiveNotification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) setNotifications(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch (e) {
      console.error(e);
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
    <div className="min-h-screen bg-[#0a0a0c] pt-8 pb-24 px-4 max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 bg-white/5 rounded-full text-white hover:bg-white/10">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No notifications yet</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-4 bg-[#1a1d24] rounded-2xl border border-white/5 flex gap-4 items-start relative">
              <button 
                onClick={() => handleDelete(n.id)}
                className="absolute top-3 right-3 p-1 bg-black/20 rounded-full text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <Link href={`/profile/${n.actor.username}`}>
                {n.actor.avatar ? (
                  <img src={n.actor.avatar} alt={n.actor.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center text-white font-bold text-lg">
                    {n.actor.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm text-gray-300">
                  <Link href={`/profile/${n.actor.username}`} className="font-semibold text-white hover:underline">
                    {n.actor.username}
                  </Link>
                  {' '}
                  {n.type === 'FOLLOW' && 'started following you.'}
                  {n.type === 'REQUEST_ACCEPTED' && 'accepted your follow request.'}
                  {n.type === 'FOLLOW_REQUEST' && 'requested to follow you.'}
                </p>
                
                {n.type === 'FOLLOW_REQUEST' && (
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => handleRequest(n.id, n.actor.id, 'accept')}
                      className="flex-1 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-bold"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRequest(n.id, n.actor.id, 'reject')}
                      className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {(n.type === 'FOLLOW' || n.type === 'REQUEST_ACCEPTED') && (
                  <div className="mt-3">
                    {!n.isFollowing ? (
                      n.isFollowRequested ? (
                        <button 
                          onClick={() => handleFollowBack(n.actor.username)}
                          className="py-1.5 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-bold"
                        >
                          Requested
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleFollowBack(n.actor.username)}
                          className="py-1.5 px-4 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-bold"
                        >
                          Follow Back
                        </button>
                      )
                    ) : (
                      <Link 
                        href={`/chat/${n.actor.username}`}
                        className="inline-block py-1.5 px-6 bg-[#252a34] hover:bg-[#323844] border border-white/10 text-white rounded-lg text-sm font-bold"
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
  );
}
