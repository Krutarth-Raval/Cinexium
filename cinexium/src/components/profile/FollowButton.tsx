'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';


export const FollowButton = ({ 
  username, 
  initialStatus, 
  isPrivate 
}: { 
  username: string, 
  initialStatus: 'NONE' | 'ACCEPTED' | 'PENDING',
  isPrivate: boolean
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const handleFollow = async () => {
    const previousStatus = status;
    const nextStatus = status === 'NONE' ? (isPrivate ? 'PENDING' : 'ACCEPTED') : 'NONE';
    
    // Optimistic UI update
    setStatus(nextStatus);
    
    try {
      const res = await fetch(`/api/users/${username}/follow`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        
        // Use the server's definitive state
        setStatus(data.status); 
        
        // Emit real-time notification via Pusher
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
        
        router.refresh();
      } else {
        setStatus(previousStatus);
      }
    } catch (e) {
      console.error(e);
      setStatus(previousStatus);
    }
  };

  if (status === 'ACCEPTED') {
    return (
      <button 
        onClick={handleFollow}
        disabled={loading}
        className="px-6 py-1.5 bg-[#252a34] hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 text-white font-medium rounded-lg transition-all text-sm border border-white/10 flex items-center gap-2"
        title="Unfollow"
      >
        Following
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
    );
  }

  if (status === 'PENDING') {
    return (
      <button 
        onClick={handleFollow}
        disabled={loading}
        className="px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-lg transition-colors text-sm border border-white/10 flex items-center gap-2"
        title="Cancel Request"
      >
        Requested
      </button>
    );
  }

  return (
    <button 
      onClick={handleFollow}
      disabled={loading}
      className="px-6 py-1.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors text-sm shadow-[0_0_15px_rgba(229,9,20,0.4)]"
    >
      Follow
    </button>
  );
};
