'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FollowButton } from './FollowButton';

import { useRouter, useSearchParams } from 'next/navigation';

type UserData = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  isPrivate: boolean;
  followStatus: 'NONE' | 'ACCEPTED' | 'PENDING';
  isMe: boolean;
};

type FollowsModalProps = {
  username: string;
};

export const FollowsModal = ({ username }: FollowsModalProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const followsParam = searchParams.get('follows');
  const isOpen = followsParam === 'followers' || followsParam === 'following';
  const initialTab = (followsParam as 'followers' | 'following') || 'followers';

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const onClose = () => {
    router.push(`/profile/${username}`);
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch(`/api/users/${username}/follows`)
        .then(res => res.json())
        .then(data => {
          setFollowers(data.followers || []);
          setFollowing(data.following || []);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-[#0f1115] md:bg-black/80 md:backdrop-blur-sm">
      <div className="bg-[#0f1115] md:bg-[#1a1d24] w-full h-full md:h-auto md:max-h-[80vh] md:max-w-md md:rounded-2xl overflow-hidden md:shadow-2xl md:border border-white/10 flex flex-col">
        {/* Header & Tabs */}
        <div className="border-b border-white/10 pt-4 md:pt-2">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center gap-2 px-4 mb-4">
            <button onClick={onClose} className="p-2 -ml-2 text-primary-500 hover:text-primary-400 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-lg font-bold text-white">@{username}</h1>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center px-4 mb-2">
            <h2 className="text-xl font-bold text-white">Connections</h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex">
            <button 
              className={`flex-1 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'followers' ? 'border-primary-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('followers')}
            >
              Followers
            </button>
            <button 
              className={`flex-1 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'following' ? 'border-primary-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No users found.
            </div>
          ) : (
            currentList.map(user => (
              <div key={user.id} className="flex items-center justify-between gap-3">
                <Link href={`/profile/${user.username}`} onClick={onClose} className="flex items-center gap-3 flex-1 min-w-0 group">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-bold text-sm truncate group-hover:underline">{user.name || `@${user.username}`}</span>
                    <span className="text-gray-400 text-xs truncate">@{user.username}</span>
                  </div>
                </Link>
                
                <div className="flex-shrink-0 ml-2">
                  {!user.isMe && (
                    user.followStatus === 'ACCEPTED' ? (
                      <Link href={`/chat/${user.username}`} onClick={onClose} className="px-4 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-lg transition-colors text-xs border border-white/10 inline-block">
                        Message
                      </Link>
                    ) : (
                      <FollowButton 
                        username={user.username} 
                        initialStatus={user.followStatus} 
                        isPrivate={user.isPrivate} 
                      />
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
