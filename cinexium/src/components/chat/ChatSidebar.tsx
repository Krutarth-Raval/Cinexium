'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSocket } from '@/components/providers/SocketProvider';
import CreateGroupModal from './CreateGroupModal';
import PinEntryModal from './PinEntryModal';
import { useHiddenChat } from '@/components/providers/HiddenChatProvider';
import { CommunityBadge } from './CommunityBadge';
import { MessageReceiptIcon } from './MessageReceiptIcon';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function ChatSidebar() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupModalMode, setGroupModalMode] = useState<'group' | 'community'>('group');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');
  const { isHiddenModeActive, setIsHiddenModeActive } = useHiddenChat();
  const pathname = usePathname();
  const { pusherClient } = useSocket();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const fetchContacts = async () => {
      try {
        const res = await fetch('/api/user/me/contacts');
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          setContacts(data.map((item: any) => item.follower || item));
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchContacts();
  }, []);

  useEffect(() => {
    if (!pusherClient) return;
    pusherClient.bind('receiveMessage', fetchConversations);
    pusherClient.bind('receiveGroupMessage', fetchConversations);
    pusherClient.bind('messageSent', fetchConversations);
    pusherClient.bind('messageReceiptUpdated', fetchConversations);
    return () => {
      pusherClient.unbind('receiveMessage', fetchConversations);
      pusherClient.unbind('receiveGroupMessage', fetchConversations);
      pusherClient.unbind('messageSent', fetchConversations);
      pusherClient.unbind('messageReceiptUpdated', fetchConversations);
    };
  }, [pusherClient]);

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const conversationUserIds = new Set(
    conversations
      .filter((conv) => !conv.isGroup && !conv.isContactOnly)
      .map((conv) => conv.user.id)
  );
  const filteredContactSuggestions = normalizedSearchQuery
    ? contacts.filter((contact) => {
        if (!contact?.id || conversationUserIds.has(contact.id)) {
          return false;
        }

        return (
          (contact.name || '').toLowerCase().includes(normalizedSearchQuery) ||
          (contact.username || '').toLowerCase().includes(normalizedSearchQuery)
        );
      })
    : [];

  const getChatKey = (conv: any) => `${conv.isGroup ? 'group' : 'chat'}:${conv.id}`;
  const selectedConversations = filteredConversations.filter((conv) => selectedIds.has(getChatKey(conv)));
  const hasPinnedSelection = selectedConversations.some((conv) => conv.isPinned);
  const hasUnpinnedSelection = selectedConversations.some((conv) => !conv.isPinned && !conv.isContactOnly);

  const clearSelection = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const toggleSelection = (conv: any) => {
    const key = getChatKey(conv);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const performBulkAction = async (action: 'pin' | 'unpin' | 'delete') => {
    if (selectedConversations.length === 0 || isBulkProcessing) return;

    setIsBulkProcessing(true);
    const selectedKeys = new Set(selectedConversations.map((conv) => getChatKey(conv)));
    const previousConversations = conversations;

    try {
      const payload = selectedConversations.map((conv) => ({
        id: conv.id,
        isGroup: conv.isGroup,
        isContactOnly: conv.isContactOnly,
      }));

      setConversations((prev) => {
        const next = prev
          .map((conv) => {
            if (!selectedKeys.has(getChatKey(conv))) {
              return conv;
            }

            if (action === 'pin') {
              return { ...conv, isPinned: true };
            }

            if (action === 'unpin') {
              return { ...conv, isPinned: false };
            }

            return { ...conv, _hiddenBySelection: true };
          })
          .filter((conv) => !conv._hiddenBySelection);

        return next.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
      });

      const res = await fetch('/api/chat/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, items: payload }),
      });

      if (!res.ok) {
        throw new Error('Bulk action failed');
      }

      clearSelection();
    } catch (error) {
      console.error(error);
      setConversations(previousConversations);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const requestDeleteSelection = () => {
    if (selectedConversations.length === 0 || isBulkProcessing) return;
    setDeleteConfirmOpen(true);
  };

  const selectedGroupCount = selectedConversations.filter((conv) => conv.isGroup).length;
  const selectedDirectCount = selectedConversations.filter((conv) => !conv.isGroup && !conv.isContactOnly).length;

  const deleteConfirmTitle =
    selectedGroupCount > 0 && selectedDirectCount > 0
      ? 'Leave Groups And Delete Chats'
      : selectedGroupCount > 0
        ? selectedGroupCount === 1
          ? 'Leave Group?'
          : 'Leave Selected Groups?'
        : selectedDirectCount === 1
          ? 'Delete Chat?'
          : 'Delete Selected Chats?';

  const deleteConfirmMessage =
    selectedGroupCount > 0 && selectedDirectCount > 0
      ? `Are you sure you want to leave ${selectedGroupCount} group${selectedGroupCount === 1 ? '' : 's'} and delete ${selectedDirectCount} one-to-one chat${selectedDirectCount === 1 ? '' : 's'} from your list?`
      : selectedGroupCount > 0
        ? `Are you sure you want to leave ${selectedGroupCount === 1 ? 'this group' : `${selectedGroupCount} selected groups`} and remove ${selectedGroupCount === 1 ? 'it' : 'them'} from your chat list?`
        : `Are you sure you want to delete ${selectedDirectCount === 1 ? 'this chat' : `${selectedDirectCount} selected chats`} from your list?`;

  const addContactToChatList = (contact: { id: string; name: string; username: string; avatar?: string | null; isPremium?: boolean }) => {
    setConversations((prev) => {
      const existingConversation = prev.find(
        (conv) => !conv.isGroup && conv.user?.id === contact.id
      );

      if (existingConversation) {
        return prev;
      }

      return [
        {
          id: `contact-${contact.id}`,
          isGroup: false,
          user: {
            id: contact.id,
            name: contact.name,
            username: contact.username,
            avatar: contact.avatar || null,
          },
          isBlocked: false,
          isMuted: false,
          isPinned: false,
          latestMessage: 'Start a conversation',
          latestMessageIsMine: false,
          latestMessageStatus: null,
          updatedAt: new Date(0).toISOString(),
          isContactOnly: true,
          unreadCount: 0,
        },
        ...prev,
      ];
    });
  };

  const handleAddContact = async (contact: { id: string; name: string; username: string; avatar?: string | null; isPremium?: boolean }) => {
    addContactToChatList(contact);
    setSearchQuery('');

    try {
      const res = await fetch(`/api/chat/${contact.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensureConversation' }),
      });

      if (!res.ok) {
        throw new Error('Failed to create chat');
      }

      await fetchConversations();
      router.push(`/chat/${contact.username}`);
    } catch (error) {
      console.error(error);
      router.push(`/chat/${contact.username}`);
    }
  };

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
                  onClick={() => { setSelectMode(true); setSelectedIds(new Set()); setIsDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" /></svg>
                  Select
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
      <div className={`relative flex-1 flex flex-col min-h-0 md:rounded-2xl md:border md:shadow-2xl ${isHiddenModeActive ? 'md:bg-[#15181e] md:border-white/10 bg-[#0a0a0c]' : 'md:bg-[#15181e] md:border-white/10'}`}>
        
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

        <div className={`flex-1 overflow-y-auto px-3 pt-2 md:pt-4 ${selectMode ? 'pb-36 md:pb-28' : 'pb-24 md:pb-4'} space-y-1 custom-scrollbar`}>
        {filteredConversations.length === 0 && filteredContactSuggestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            {searchQuery ? 'No contacts found.' : 'No messages or contacts yet.'}
          </div>
        ) : (
          <>
          {filteredConversations.map(conv => {
            const href = conv.isGroup ? `/chat/group/${conv.id}` : `/chat/${conv.user.username}`;
            const isActiveConversation = pathname === href;
            const visibleUnreadCount = isActiveConversation ? 0 : conv.unreadCount;

            return (
            <Link
              key={conv.id}
              href={href}
              onClick={(e) => {
                if (selectMode) {
                  e.preventDefault();
                  toggleSelection(conv);
                }
              }}
              onTouchStart={() => {
                if (selectMode) return;
                clearLongPressTimer();
                longPressTimerRef.current = setTimeout(() => {
                  setSelectMode(true);
                  setSelectedIds(new Set([getChatKey(conv)]));
                }, 450);
              }}
              onTouchEnd={clearLongPressTimer}
              onTouchMove={clearLongPressTimer}
              onTouchCancel={clearLongPressTimer}
              className={`relative flex items-center gap-3 p-3 rounded-xl transition-all border ${
                selectMode && selectedIds.has(getChatKey(conv))
                  ? 'bg-primary-500/10 border-primary-500/40'
                  : isActiveConversation
                    ? 'bg-white/10 border-white/10'
                    : 'border-white/5 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              {selectMode ? (
                <div className={`absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                  selectedIds.has(getChatKey(conv))
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : 'border-white/30 bg-black/20 text-transparent'
                }`}>
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : null}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
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
                  <div className={`flex min-w-0 items-center gap-1.5 ${visibleUnreadCount > 0 ? 'text-white font-semibold' : (conv.isContactOnly ? 'text-gray-500 italic' : 'text-gray-400')}`}>
                    {conv.latestMessageIsMine && conv.latestMessageStatus ? (
                      <MessageReceiptIcon status={conv.latestMessageStatus} className="shrink-0" />
                    ) : null}
                    <p className="truncate text-xs">
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
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {conv.isPinned && !selectMode && (
                      <svg className="w-3.5 h-3.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 17v5" />
                        <path d="M9 3h6l-1 5 3 3v1H7v-1l3-3-1-5Z" />
                      </svg>
                    )}
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
          )})}

          {normalizedSearchQuery && filteredContactSuggestions.length > 0 && (
            <div className="mt-4">
              <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                Followers
              </div>
              <div className="space-y-1">
                {filteredContactSuggestions.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center gap-3 rounded-xl border border-white/5 p-3 transition-all hover:bg-white/5 hover:border-white/10"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg">
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{(contact.name || contact.username || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{contact.name}</p>
                      <p className="truncate text-xs text-gray-400">@{contact.username}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void handleAddContact(contact); }}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
        )}
      </div>
      {selectMode && (
        <div className="fixed bottom-24 left-1/2 z-[60] mt-auto flex w-[90%] -translate-x-1/2 justify-center px-4 md:sticky md:bottom-4 md:left-auto md:w-auto md:translate-x-0 md:px-0 md:pb-4">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1a1d24]/95 px-3 py-2 shadow-2xl backdrop-blur-xl">
            <button
              type="button"
              onClick={clearSelection}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
              title="Cancel"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => performBulkAction('pin')}
              disabled={!hasUnpinnedSelection || isBulkProcessing}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-500 transition-colors hover:bg-primary-500 hover:text-white disabled:opacity-40"
              title="Pin"
            >
              <svg className="h-5 w-5 -rotate-[25deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" />
                <path d="M9 3h6l-1 5 3 3v1H7v-1l3-3-1-5Z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => performBulkAction('unpin')}
              disabled={!hasPinnedSelection || isBulkProcessing}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              title="Unpin"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5" />
                <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />
                <path d="m2 2 20 20" />
                <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" />
              </svg>
            </button>
            <button
              type="button"
              onClick={requestDeleteSelection}
              disabled={selectedConversations.length === 0 || isBulkProcessing}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-40"
              title="Delete"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      )}
      </div>
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          void performBulkAction('delete');
        }}
        title={deleteConfirmTitle}
        message={deleteConfirmMessage}
        confirmText={selectedGroupCount > 0 ? 'Leave & Delete' : 'Delete'}
        isDestructive
      />
    </div>
  );
}
