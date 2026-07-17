'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';
import CreateGroupModal from './CreateGroupModal';
import PinEntryModal from './PinEntryModal';
import { useHiddenChat } from '@/components/providers/HiddenChatProvider';
import { CommunityBadge } from './CommunityBadge';

export default function ChatSidebar() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<'group' | 'community'>('group');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const { isHiddenModeActive, setIsHiddenModeActive } = useHiddenChat();
  const pathname = usePathname();
  const { pusherClient } = useSocket();

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/chat${isHiddenModeActive ? '?hidden=true' : ''}`);
      if (res.ok) {
        setConversations(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setConversations([]);
  }, [isHiddenModeActive]);

  useEffect(() => {
    fetchConversations();
  }, [pathname, isHiddenModeActive]);

  useEffect(() => {
    const handleChatReadSync = () => {
      fetchConversations();
    };

    window.addEventListener('chat:read-sync', handleChatReadSync);

    return () => {
      window.removeEventListener('chat:read-sync', handleChatReadSync);
    };
  }, [isHiddenModeActive]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (!res.ok) return;
        const data = await res.json();
        setCurrentUsername(data.user?.username || '');
      } catch (e) {
        console.error(e);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!pusherClient) return;
    pusherClient.bind('receiveMessage', fetchConversations);
    pusherClient.bind('receiveGroupMessage', fetchConversations);
    return () => {
      pusherClient.unbind('receiveMessage', fetchConversations);
      pusherClient.unbind('receiveGroupMessage', fetchConversations);
    };
  }, [pusherClient]);

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full overflow-hidden md:gap-4 transition-colors duration-300 ${isHiddenModeActive ? 'md:bg-transparent bg-[#0a0a0c]' : 'md:bg-transparent'}`}>
      {/* Mobile: Combined Header, Desktop: Title Bento Box */}
      <div className={`flex flex-col sticky md:static top-0 z-20 shrink-0 md:rounded-2xl md:border md:shadow-2xl ${isHiddenModeActive ? 'bg-[#0a0a0c] md:bg-[#15181e] border-b border-red-900/30 md:border-white/10' : 'bg-[#15181e] border-b border-white/10 md:border-white/10'}`}>
        
        {/* Title and Dropdown */}
        <div className="flex items-center justify-between p-4 w-full">
          <h2 className={`text-xl font-bold ${isHiddenModeActive ? 'text-red-500' : 'text-white'}`}>
            {isHiddenModeActive ? 'Hidden Chats' : 'Messages'}
          </h2>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`p-1.5 rounded-full ${isHiddenModeActive ? 'bg-red-900/20 text-red-500 hover:bg-red-900/40' : 'bg-white/5 hover:bg-white/10 text-white'} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl py-1 z-50">
                <button
                  onClick={() => { setGroupModalMode('group'); setIsGroupModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Group
                </button>
                <button
                  onClick={() => { setGroupModalMode('community'); setIsGroupModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                  Create Community
                </button>
                <button
                  onClick={() => {
                    if (currentUsername) {
                      router.push(`/profile/${currentUsername}`);
                    }
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6.75a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  My Profile
                </button>
                <button
                  onClick={() => { router.push('/settings/notifications'); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.081 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                  Notification Setting
                </button>
                {!isHiddenModeActive ? (
                  <button
                    onClick={() => { setIsPinModalOpen(true); setIsDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 border-t border-white/5 mt-1 pt-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    Hidden Chats
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsHiddenModeActive(false); setIsDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2 border-t border-white/5 mt-1 pt-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Exit Hidden Mode
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Search Bar */}
        <div className="relative px-4 pb-4 md:hidden">
          <svg className="w-4 h-4 absolute left-7 top-1/2 -translate-y-1/2 -mt-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search contacts & groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isHiddenModeActive ? 'bg-red-900/10 focus:ring-red-500' : 'bg-[#1a1d24] focus:ring-primary-500'} text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 border border-white/5 placeholder-gray-500`}
          />
        </div>
      </div>

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} mode={groupModalMode} />
      <PinEntryModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} onSuccess={() => setIsPinModalOpen(false)} />

      {/* Desktop Search & List Bento Box */}
      <div className={`flex-1 flex flex-col min-h-0 md:rounded-2xl md:border md:shadow-2xl ${isHiddenModeActive ? 'md:bg-[#15181e] md:border-white/10 bg-[#0a0a0c]' : 'md:bg-[#15181e] md:border-white/10'}`}>
        
        {/* Desktop Search Bar */}
        <div className="hidden md:block p-4 shrink-0 border-b border-white/5">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search contacts & groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isHiddenModeActive ? 'bg-red-900/10 focus:ring-red-500' : 'bg-[#1a1d24] focus:ring-primary-500'} text-white text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 border border-white/5 placeholder-gray-500`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pt-2 md:pt-4 pb-24 md:pb-4 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'No contacts found.' : 'No messages or contacts yet.'}
          </div>
        ) : (
          filteredConversations.map(conv => {
            const href = conv.isGroup ? `/chat/group/${conv.id}` : `/chat/${conv.user.username}`;
            const isActiveConversation = pathname === href;
            const visibleUnreadCount = isActiveConversation ? 0 : conv.unreadCount;

            return (
            <Link
              key={conv.id}
              href={href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${isActiveConversation ? 'bg-white/10 border-white/10' : 'border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                  {!conv.isBlocked && conv.user.avatar ? (
                    <img src={conv.user.avatar} alt={conv.user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{conv.isBlocked ? '@' : conv.user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {conv.isGroup && (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#15181e] ${conv.isCommunity ? 'bg-blue-500' : 'bg-gray-600'}`} title={conv.isCommunity ? 'Community' : 'Group'}>
                    {conv.isCommunity ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5 min-w-0">
                  <h3 className="font-semibold text-white flex items-center gap-1 min-w-0 pr-2">
                    <span className="truncate">{conv.isGroup ? conv.user.username : (conv.isBlocked ? '@cinexium_user' : (conv.user.name || `@${conv.user.username}`))}</span>
                    {conv.isGroup && conv.isPremiumOnly && <CommunityBadge iconSize="w-3.5 h-3.5" />}
                  </h3>
                  {!conv.isContactOnly && (
                    <span className="text-[10px] text-gray-500 flex-shrink-0 font-medium">
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate ${visibleUnreadCount > 0 ? 'text-white font-semibold' : (conv.isContactOnly ? 'text-gray-500 italic' : 'text-gray-400')}`}>
                    {(() => {
                      if (conv.latestMessage?.startsWith('[GROUP_INVITE]:')) return 'Group Invite';
                      if (conv.latestMessage?.startsWith('[COLLECTION_SHARE]:')) {
                        try {
                          const meta = JSON.parse(conv.latestMessage.substring(19));
                          if (meta.creatorUsername === 'Cinexium:movie') return 'Shared a Movie';
                          if (meta.creatorUsername === 'Cinexium:tv' || meta.creatorUsername === 'Cinexium:series') return 'Shared a Series';
                          if (meta.creatorUsername === 'Cinexium') return 'Shared a Movie';
                          return 'Shared a Collection';
                        } catch {
                          return 'Shared a Collection';
                        }
                      }
                      if (conv.latestMessage === '[GIF]') return 'Shared a GIF';
                      return conv.latestMessage || 'No messages yet';
                    })()}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {conv.isMuted && (
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                    {visibleUnreadCount > 0 && (
                      <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-500 rounded-full text-[10px] font-bold text-white shadow-[0_0_8px_rgba(229,9,20,0.5)]">
                        {visibleUnreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )})
        )}
      </div>
      </div>
    </div>
  );
}
