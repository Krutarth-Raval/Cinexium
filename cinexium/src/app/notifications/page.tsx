'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  const { pusherClient } = useSocket();

  useEffect(() => {
    fetchNotifications();
    markAsRead();
  }, []);

  useEffect(() => {
    if (!pusherClient) return;
    const handleNewNotification = () => fetchNotifications();
    pusherClient.bind('receiveNotification', handleNewNotification);
    return () => {
      pusherClient.unbind('receiveNotification', handleNewNotification);
    };
  }, [pusherClient]);

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

  const handleRequest = async (notificationId: string, actorId: string, action: 'accept' | 'reject', type: string = 'FOLLOW_REQUEST', referenceId?: string) => {
    try {
      if (type === 'COMMUNITY_JOIN_REQUEST') {
        const endpoint = action === 'accept' ? 'accept' : 'reject';
        const res = await fetch(`/api/chat/community/request/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId, actorId, communityId: referenceId })
        });
        if (res.ok) {
           fetchNotifications();
           router.refresh();
        }
        return;
      }

      const res = await fetch(`/api/notifications/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, actorId })
      });
      if (res.ok) {
        if (action === 'accept') {
          fetch('/api/notifications/pusher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUserId: actorId,
              type: 'REQUEST_ACCEPTED',
              actor: { username: 'Someone' } 
            })
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
        if (data.targetUserId && data.status !== 'NONE') {
          fetch('/api/notifications/pusher', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetUserId: data.targetUserId,
              type: data.status === 'PENDING' ? 'FOLLOW_REQUEST' : 'FOLLOW',
              actor: { username }
            })
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
                    @{n.actor.username}
                  </Link>
                  {' '}
                  {n.type === 'FOLLOW' && 'started following you.'}
                  {n.type === 'REQUEST_ACCEPTED' && 'accepted your follow request.'}
                  {n.type === 'FOLLOW_REQUEST' && 'requested to follow you.'}
                  {n.type === 'COMMENT_REPLY' && 'replied to your comment.'}
                  {n.type === 'COMMUNITY_JOIN_REQUEST' && 'requested to join your community.'}
                  {n.type === 'SUBSCRIPTION_REQUEST' && `requested ${n.referenceType === 'yearly' ? 'Yearly' : 'Monthly'} Premium.`}
                </p>

                {n.type === 'SUBSCRIPTION_REQUEST' && (
                  <div className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
                      New Premium Request
                    </p>
                    <p className="mt-2 text-sm text-yellow-100/80">
                      Open User Subscriptions to review this request, send the payment email, and activate Premium after payment is confirmed.
                    </p>
                    <Link
                      href="/settings/admin-tools/subscriptions"
                      className="mt-3 inline-flex rounded-xl bg-yellow-300 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-yellow-200"
                    >
                      Open User Subscriptions
                    </Link>
                  </div>
                )}

                {n.type === 'COMMENT_REPLY' && n.referenceId && (
                  <div className="mt-3">
                    <Link
                      href={`/${n.referenceType === 'tv' ? 'series' : 'movie'}/${n.referenceId}`}
                      className="inline-block py-1.5 px-6 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-bold"
                    >
                      View Reply
                    </Link>
                  </div>
                )}
                
                {(n.type === 'FOLLOW_REQUEST' || n.type === 'COMMUNITY_JOIN_REQUEST') && (
                  <div className="mt-3 flex gap-2">
                    <button 
                      onClick={() => handleRequest(n.id, n.actor.id, 'accept', n.type, n.referenceId)}
                      className="flex-1 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-bold"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleRequest(n.id, n.actor.id, 'reject', n.type, n.referenceId)}
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
