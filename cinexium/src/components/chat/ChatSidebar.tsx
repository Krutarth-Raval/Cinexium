'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';
import CreateGroupModal from './CreateGroupModal';
import PinEntryModal from './PinEntryModal';
import { useHiddenChat } from '@/components/providers/HiddenChatProvider';

export default function ChatSidebar() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isHiddenModeActive, setIsHiddenModeActive } = useHiddenChat();
  const pathname = usePathname();
  const { socket } = useSocket();

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
    fetchConversations();
  }, [pathname, isHiddenModeActive]);

  useEffect(() => {
    if (!socket) return;
    socket.on('receiveMessage', fetchConversations);
    return () => {
      socket.off('receiveMessage', fetchConversations);
    };
  }, [socket]);

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${isHiddenModeActive ? 'bg-[#0a0a0c]' : ''}`}>
      <div className={`p-4 border-b ${isHiddenModeActive ? 'border-red-900/30 bg-[#0a0a0c]' : 'border-white/10 bg-[#15181e]'} flex flex-col gap-4 sticky top-0 z-10 shrink-0`}>
        <div className="flex items-center justify-between">
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
                  onClick={() => { setIsGroupModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Create Group
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

      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <PinEntryModal isOpen={isPinModalOpen} onClose={() => setIsPinModalOpen(false)} onSuccess={() => setIsPinModalOpen(false)} />

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-24 md:pb-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'No contacts found.' : 'No messages or contacts yet.'}
          </div>
        ) : (
          filteredConversations.map(conv => (
            <Link
              key={conv.id}
              href={conv.isGroup ? `/chat/group/${conv.id}` : `/chat/${conv.user.username}`}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${(conv.isGroup ? pathname === `/chat/group/${conv.id}` : pathname === `/chat/${conv.user.username}`) ? 'bg-white/10 border-white/10' : 'border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                {conv.user.avatar ? (
                  <img src={conv.user.avatar} alt={conv.user.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{conv.user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-semibold text-white truncate pr-2">{conv.user.username}</h3>
                  {!conv.isContactOnly && (
                    <span className="text-[10px] text-gray-500 flex-shrink-0 font-medium">
                      {new Date(conv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-semibold' : (conv.isContactOnly ? 'text-gray-500 italic' : 'text-gray-400')}`}>
                    {conv.latestMessage?.startsWith('[GROUP_INVITE]:') ? 'Group Invite' : (conv.latestMessage || 'No messages yet')}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {conv.isMuted && (
                      <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                    {conv.unreadCount > 0 && (
                      <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-primary-500 rounded-full text-[10px] font-bold text-white shadow-[0_0_8px_rgba(229,9,20,0.5)]">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
