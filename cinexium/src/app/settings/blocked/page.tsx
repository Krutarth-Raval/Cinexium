'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BlockedUsersPage() {
  const router = useRouter();
  
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/users/blocked');
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const unblockUser = async (username: string) => {
    try {
      const res = await fetch(`/api/users/${username}/block`, { method: 'POST' });
      if (res.ok) {
        // Remove the user from the list optimistically
        setBlockedUsers(prev => prev.filter(u => u.username !== username));
      }
    } catch (e) {
      console.error('Failed to unblock', e);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1115] overflow-y-auto md:relative md:inset-auto md:z-auto md:min-h-screen md:bg-transparent md:pt-24 md:pb-12 md:px-4 flex flex-col md:max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6 md:mb-8 p-4 md:p-0 sticky top-0 bg-[#0f1115]/90 backdrop-blur-md z-10 md:static md:bg-transparent">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5" aria-label="Go back">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl md:text-3xl font-bold text-white">Blocked Users</h1>
      </div>

      <div className="flex-1 px-4 md:px-0">
        {blockedUsers.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-lg font-medium">No blocked users</p>
            <p className="text-sm mt-1">When you block someone, they will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-[#1a1d24] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{user.name}</h3>
                    <p className="text-gray-400 text-sm">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => unblockUser(user.username)}
                  className="px-4 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-lg transition-colors text-sm border border-white/10"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
