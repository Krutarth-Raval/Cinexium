'use client';

import { useState, useEffect, useLayoutEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/components/providers/SocketProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { GifPicker } from '@/components/gif/GifPicker';
import { SelectedGifPreview } from '@/components/gif/SelectedGifPreview';
import { ChatPageBoneyard } from '@/components/skeleton/Boneyard';
import { GroupInviteCard } from '@/components/chat/GroupInviteCard';
import { CollectionShareCard } from '@/components/chat/CollectionShareCard';
import { MediaShareCard } from '@/components/chat/MediaShareCard';
import { MessageReceiptIcon, getMessageReceiptStatus } from '@/components/chat/MessageReceiptIcon';
import { getUserChannelName } from '@/lib/pusher';
import type { GifSelection } from '@/lib/giphy';

export default function ChatRoom({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { pusherClient } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [input, setInput] = useState('');
  const [selectedGif, setSelectedGif] = useState<GifSelection | null>(null);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  // Derived state for block/follow logic
  const isBlockedByMe = targetUser?.isBlockedByMe;
  const hasBlockedMe = targetUser?.hasBlockedMe;
  const isBlocked = isBlockedByMe || hasBlockedMe;
  const isFollowing = targetUser?.isFollowing;
  const isFollowedBy = targetUser?.isFollowedBy;
  const showNotFollowingBanner = targetUser && !isBlocked && (!isFollowing || !isFollowedBy);

  // Override target user display if blocked
  const displayTargetUser = isBlocked ? {
    ...targetUser,
    name: '@cinexium_user',
    username: 'cinexium_user',
    avatar: null
  } : targetUser;

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [reactionModalData, setReactionModalData] = useState<{ isOpen: boolean; reactions: any[] }>({ isOpen: false, reactions: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const isInitialScroll = useRef(true);
  const preserveScrollPosition = useRef(false);
  const previousScrollHeight = useRef(0);
  const previousScrollTop = useRef(0);
  const MAX_CHAT_MESSAGE_LENGTH = 1000;
  const isOverMessageLimit = input.length > MAX_CHAT_MESSAGE_LENGTH;
  const canSendMessage = Boolean(input.trim() || selectedGif) && !isOverMessageLimit;
  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const openMessageActions = (messageId: string) => {
    clearLongPressTimer();
    setActiveMessageId(messageId);
  };
  const closeMessageActions = () => {
    clearLongPressTimer();
    setActiveMessageId(null);
  };
  const notifySidebarReadSync = () => {
    window.dispatchEvent(new CustomEvent('chat:read-sync'));
  };
  const syncConversationReadState = async () => {
    try {
      const res = await fetch(`/api/chat/${username}?limit=1`);
      if (res.ok) {
        notifySidebarReadSync();
      }
    } catch (error) {
      console.error('Failed to sync conversation read state:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'markRead',
          messageId,
        })
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const fetchChat = async (before?: string) => {
    try {
      const query = new URLSearchParams({ limit: '50' });
      if (before) query.set('before', before);
      const res = await fetch(`/api/chat/${username}?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.targetUser) throw new Error('User not found');
        setTargetUser(data.targetUser);
        setCurrentUser(data.currentUser);
        setMessages((prev: any[]) => before ? [...(data.messages || []), ...prev] : (data.messages || []));
        setHasMoreMessages(Boolean(data.hasMore));
        setSettings(data.conversation || { isMuted: false, isHidden: false });
        if (!before) {
          notifySidebarReadSync();
        }
      } else {
        throw new Error('Failed to load chat');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    isInitialScroll.current = true;
    fetchChat();
  }, [username]);

  useEffect(() => {
    const handleTouchCleanup = () => {
      clearLongPressTimer();
    };

    const handlePageHide = () => {
      closeMessageActions();
    };

    window.addEventListener('touchend', handleTouchCleanup, { passive: true });
    window.addEventListener('touchcancel', handleTouchCleanup, { passive: true });
    window.addEventListener('pointerup', handleTouchCleanup, { passive: true });
    window.addEventListener('pointercancel', handleTouchCleanup, { passive: true });
    window.addEventListener('blur', handlePageHide);
    document.addEventListener('visibilitychange', handlePageHide);

    return () => {
      window.removeEventListener('touchend', handleTouchCleanup);
      window.removeEventListener('touchcancel', handleTouchCleanup);
      window.removeEventListener('pointerup', handleTouchCleanup);
      window.removeEventListener('pointercancel', handleTouchCleanup);
      window.removeEventListener('blur', handlePageHide);
      document.removeEventListener('visibilitychange', handlePageHide);
    };
  }, []);

  useLayoutEffect(() => {
    if (messages.length > 0) {
      if (preserveScrollPosition.current && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        const nextScrollHeight = container.scrollHeight;
        container.scrollTop = nextScrollHeight - previousScrollHeight.current + previousScrollTop.current;
        preserveScrollPosition.current = false;
        return;
      }

      if (isInitialScroll.current) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        isInitialScroll.current = false;
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const loadOlderMessages = async () => {
    if (isLoadingOlderMessages || !hasMoreMessages || messages.length === 0) return;

    const container = messagesContainerRef.current;
    if (container) {
      previousScrollHeight.current = container.scrollHeight;
      previousScrollTop.current = container.scrollTop;
      preserveScrollPosition.current = true;
    }

    setIsLoadingOlderMessages(true);
    try {
      await fetchChat(messages[0]?.id);
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || isLoadingOlderMessages || !hasMoreMessages) return;

    if (container.scrollTop <= 80) {
      loadOlderMessages();
    }
  };

  useEffect(() => {
    if (!pusherClient || !targetUser || !currentUser) return;

    const channelName = getUserChannelName(currentUser.id);
    let channel = pusherClient.channel(channelName);
    
    if (!channel) {
      channel = pusherClient.subscribe(channelName);
    }

    const handleMessage = (data: any) => {
      // If we receive a message from the target user
      if (data?.message?.senderId === targetUser.id) {
        setMessages(prev => {
          const matchingTemp = prev.find((message) => message.id.startsWith('temp-') && (message.gifId ?? null) === (data.message.gifId ?? null));
          return [...prev, {
            ...data.message,
            gifWidth: data.message.gifWidth ?? matchingTemp?.gifWidth ?? null,
            gifHeight: data.message.gifHeight ?? matchingTemp?.gifHeight ?? null,
          }];
        });
        void markMessageAsRead(data.message.id);
        void syncConversationReadState();
      }
    };

    const handleMessageSent = (data: any) => {
      // If our message was successfully saved by WS server
      if (data?.message?.senderId === currentUser.id && 
          (data.message.conversationId === settings?.id || !settings?.id)) {
        setMessages(prev => {
          const matchingTemp = prev.find((message) =>
            message.id.startsWith('temp-') &&
            message.content === data.message.content &&
            (message.gifId ?? null) === (data.message.gifId ?? null)
          );
          const filtered = prev.filter((m) => {
            if (!m.id.startsWith('temp-')) return true;
            return !(
              m.content === data.message.content &&
              (m.gifId ?? null) === (data.message.gifId ?? null)
            );
          });
          return [...filtered, {
            ...data.message,
            gifWidth: data.message.gifWidth ?? matchingTemp?.gifWidth ?? null,
            gifHeight: data.message.gifHeight ?? matchingTemp?.gifHeight ?? null,
          }];
        });
      }
    };

    const handleMessageUpdated = (data: any) => {
      if (data?.message) {
        setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m));
      }
    };

    const handleMessageReceiptUpdated = (data: any) => {
      const receiptIds = Array.isArray(data?.messageIds) ? new Set(data.messageIds) : null;
      if (!receiptIds || receiptIds.size === 0) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          receiptIds.has(message.id)
            ? {
                ...message,
                deliveredAt: data.deliveredAt ?? message.deliveredAt ?? null,
                isRead: Boolean(data.isRead) || message.isRead,
              }
            : message
        )
      );
    };

    const handleBlockStatusChanged = (data: any) => {
      if (data.blockerId === targetUser.id || data.blockedId === targetUser.id) {
        setTargetUser((prev: any) => {
          if (!prev) return prev;
          if (data.blockerId === currentUser.id) {
            return { ...prev, isBlockedByMe: data.isBlocked };
          } else if (data.blockerId === targetUser.id) {
            return { ...prev, hasBlockedMe: data.isBlocked };
          }
          return prev;
        });
      }
    };

    channel.bind('receiveMessage', handleMessage);
    channel.bind('messageSent', handleMessageSent);
    channel.bind('messageUpdated', handleMessageUpdated);
    channel.bind('messageReceiptUpdated', handleMessageReceiptUpdated);
    channel.bind('blockStatusChanged', handleBlockStatusChanged);
    
    return () => {
      channel?.unbind('receiveMessage', handleMessage);
      channel?.unbind('messageSent', handleMessageSent);
      channel?.unbind('messageUpdated', handleMessageUpdated);
      channel?.unbind('messageReceiptUpdated', handleMessageReceiptUpdated);
      channel?.unbind('blockStatusChanged', handleBlockStatusChanged);
    };
  }, [pusherClient, targetUser, currentUser, settings]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendMessage || !targetUser || !currentUser) return;
    
    const content = input.trim();
    const pendingGif = selectedGif;
    setInput('');
    setSelectedGif(null);
    setIsGifPickerOpen(false);
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });

    if (editingMessageId) {
      try {
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'editMessage',
            messageId: editingMessageId,
            targetUserId: targetUser.id,
            content
          })
        });
        setEditingMessageId(null);
      } catch (e: any) { alert(e.message); }
      return;
    }

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      content,
      gifId: pendingGif?.id ?? null,
      gifUrl: pendingGif?.url ?? null,
      gifWidth: pendingGif?.width ?? null,
      gifHeight: pendingGif?.height ?? null,
      senderId: currentUser.id,
      createdAt: new Date().toISOString()
    }]);

    try {
      fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sendMessage',
          targetUserId: targetUser.id,
          content,
          gifId: pendingGif?.id ?? null,
          gifUrl: pendingGif?.url ?? null,
        })
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    
    // Optimistic UI update
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const existingReactions = m.reactions || [];
        const otherReactions = existingReactions.filter((r: any) => r.userId !== currentUser.id);
        return {
          ...m,
          reactions: [...otherReactions, { emoji, userId: currentUser.id, user: currentUser }]
        };
      }
      return m;
    }));

    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reactMessage',
        messageId,
        reaction: emoji,
        targetUserId: targetUser.id
      })
    });
  };

  const handleDelete = (messageId: string) => {
    if (!targetUser) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Message',
      message: 'Delete this message for everyone?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deleteMessageForEveryone',
            messageId,
            targetUserId: targetUser.id
          })
        });
      }
    });
  };

  const updateSettings = async (action: string) => {
    try {
      const res = await fetch(`/api/chat/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        if (action === 'delete') {
          setMessages([]);
        } else if (action === 'mute') {
          setSettings({ ...settings, isMuted: true });
        } else if (action === 'unmute') {
          setSettings({ ...settings, isMuted: false });
        } else if (action === 'hide' || action === 'unhide') {
          setSettings({ ...settings, isHidden: action === 'hide' });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <ChatPageBoneyard />;
  }

  if (error || !targetUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">{error}</h2>
      </div>
    );
  }

  // Group messages by Date
  const groupedMessages: { [date: string]: any[] } = {};
  messages.forEach(msg => {
    const d = new Date(msg.createdAt || Date.now());
    const dateStr = d.toDateString(); // Safe for new Date()
    if (!groupedMessages[dateStr]) groupedMessages[dateStr] = [];
    groupedMessages[dateStr].push(msg);
  });

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex-1 flex h-full min-h-0 md:bg-transparent bg-[#1a1d24] md:gap-4 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 relative md:rounded-2xl md:border md:border-white/10 md:shadow-2xl overflow-hidden bg-[#1a1d24]">
        {!editingMessageId && (
          <GifPicker
            isOpen={isGifPickerOpen}
            mode="drawer"
            variant="comment"
            onClose={() => setIsGifPickerOpen(false)}
            onSelect={(gif) => setSelectedGif(gif)}
          />
        )}
        {/* Header */}
        <div className="relative">
          <button 
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className="w-full h-[73px] px-4 border-b border-white/10 flex items-center justify-between bg-[#1a1d24] z-10 shrink-0 hover:bg-white/5 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div onClick={e => e.stopPropagation()} className="flex items-center">
                <Link href="/chat" className="md:hidden text-gray-400 hover:text-white mr-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </Link>
              </div>
              <div onClick={e => e.stopPropagation()} className="flex items-center">
                <Link href={`/profile/${targetUser.username}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {targetUser.avatar ? (
                    <img src={targetUser.avatar} alt={targetUser.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{targetUser.name.charAt(0).toUpperCase()}</span>
                  )}
                </Link>
              </div>
              <div>
                <p className="text-white font-medium">
                  {targetUser.name || `@${targetUser.username}`}
                </p>
                <p className="text-xs text-gray-400">@{targetUser.username}</p>
              </div>
            </div>
            
            <div className={`transition-transform duration-300 ${isInfoOpen ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}
          onClick={closeMessageActions}
          onTouchStart={() => {
            if (activeMessageId) closeMessageActions();
          }}
          className="flex-1 overflow-y-auto p-4 flex flex-col"
        >
          <div className="flex-1 min-h-[1rem]" />
          {isLoadingOlderMessages && (
            <div className="flex justify-center py-3">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 text-sm py-10">
              Say hi to {targetUser.name || `@${targetUser.username}`}!
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedMessages).map(dateStr => (
                <div key={dateStr} className="space-y-4">
                  <div className="flex justify-center pointer-events-none">
                    <span className="bg-[#15181e]/80 backdrop-blur text-gray-400 text-xs px-3 py-1 rounded-full border border-white/5 shadow-sm">
                      {formatDateLabel(dateStr)}
                    </span>
                  </div>
                  
                  {groupedMessages[dateStr].map((msg: any) => {
                    const isMe = msg.senderId !== targetUser.id;
                    const isDeleted = msg.isDeletedForEveryone;
                    const hasGif = Boolean(msg.gifUrl);
                    const isGroupInvite = typeof msg.content === 'string' && msg.content.startsWith('[GROUP_INVITE]:');
                    const isCollectionShare = typeof msg.content === 'string' && msg.content.startsWith('[COLLECTION_SHARE]:');
                    const isEditableTextMessage = !hasGif && !isGroupInvite && !isCollectionShare;
                    const shouldUsePosterWidthForText = typeof msg.content === 'string' && (
                      msg.content.includes('\n') || msg.content.trim().length > 18
                    );
                    
                    // Get reaction representation
                    const uniqueReactions: string[] = msg.reactions ? Array.from(new Set(msg.reactions.map((r: any) => r.emoji as string))) : [];
                    const reactionCount = msg.reactions?.length || 0;

                    return (
                      <div key={msg.id} className={`flex group items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden mb-5 shadow-sm">
                            {displayTargetUser?.avatar ? (
                              <img src={displayTargetUser.avatar} alt={displayTargetUser.name || displayTargetUser.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">{(displayTargetUser?.name || displayTargetUser?.username).charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                          <div 
                            className="flex items-center gap-2 relative min-w-0"
                            onContextMenu={(e) => e.preventDefault()}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              clearLongPressTimer();
                              longPressTimer.current = setTimeout(() => openMessageActions(msg.id), 500);
                            }}
                            onTouchEnd={clearLongPressTimer}
                            onTouchMove={clearLongPressTimer}
                            onTouchCancel={clearLongPressTimer}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeMessageId) {
                                closeMessageActions();
                              }
                            }}
                          >
                        {/* Reaction / Edit / Delete Hover Menu */}
                        {isMe && !isDeleted && !msg.id.startsWith('temp-') && (
                          <div className={`flex items-center gap-2 transition-opacity mr-2 ${activeMessageId === msg.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
                            <div className="flex gap-1 bg-[#252a34] rounded-full px-2 py-1 border border-white/5 shadow-lg">
                              {isEditableTextMessage && (
                                <button onClick={(e) => { e.stopPropagation(); setEditingMessageId(msg.id); setInput(msg.content); setSelectedGif(null); setIsGifPickerOpen(false); closeMessageActions(); }} className="text-gray-400 hover:text-white p-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); closeMessageActions(); }} className="text-gray-400 hover:text-red-500 p-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        )}

                            {isGroupInvite ? (() => {
                                    try {
                                      const meta = JSON.parse(msg.content.substring(15));
                                      return <GroupInviteCard meta={meta} isMe={isMe} timestamp={msg.createdAt} receiptStatus={isMe ? getMessageReceiptStatus(msg) : undefined} uniqueReactions={uniqueReactions} reactionCount={reactionCount} />;
                                    } catch(e) {
                                      return (
                                        <div className={`flex min-w-0 ${shouldUsePosterWidthForText ? 'w-[180px] max-w-[180px]' : 'max-w-[180px]'} flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                          <div className={`relative ${shouldUsePosterWidthForText ? 'w-full' : 'w-auto'} max-w-full min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5'}`}>
                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                          </div>
                                          <div className={`mt-1 flex items-center gap-1 px-0.5 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                            <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                            {isMe ? (
                                              <MessageReceiptIcon status={getMessageReceiptStatus(msg)} className="shrink-0" />
                                            ) : null}
                                          </div>
                                        </div>
                                      );
                                    }
                                  })() : isCollectionShare ? (() => {
                                    try {
                                      const meta = JSON.parse(msg.content.substring(19));
                                      const isMedia = meta.creatorUsername?.startsWith('Cinexium') && meta.itemCount === 0;
                                      if (isMedia) {
                                        return <MediaShareCard meta={meta} isMe={isMe} timestamp={msg.createdAt} receiptStatus={isMe ? getMessageReceiptStatus(msg) : undefined} uniqueReactions={uniqueReactions} reactionCount={reactionCount} />;
                                      }
                                      return <CollectionShareCard meta={meta} isMe={isMe} timestamp={msg.createdAt} receiptStatus={isMe ? getMessageReceiptStatus(msg) : undefined} uniqueReactions={uniqueReactions} reactionCount={reactionCount} />;
                                    } catch(e) {
                                      return (
                                        <div className={`flex min-w-0 ${shouldUsePosterWidthForText ? 'w-[180px] max-w-[180px]' : 'max-w-[180px]'} flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                          <div className={`relative ${shouldUsePosterWidthForText ? 'w-full' : 'w-auto'} max-w-full min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5'}`}>
                                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                          </div>
                                          <div className={`mt-1 flex items-center gap-1 px-0.5 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                            <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                            {isMe ? (
                                              <MessageReceiptIcon status={getMessageReceiptStatus(msg)} className="shrink-0" />
                                            ) : null}
                                          </div>
                                        </div>
                                      );
                                    }
                                  })() : hasGif ? (
                                    <div className={`flex min-w-0 w-[180px] flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} ${isDeleted ? 'opacity-50 italic' : ''}`}>
                                      <div className="relative">
                                        <div className={`overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d24] shadow-xl isolate ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                                        {msg.gifUrl && (
                                          <div
                                            className="w-full bg-[#111318]"
                                            style={msg.gifWidth && msg.gifHeight ? { aspectRatio: `${msg.gifWidth} / ${msg.gifHeight}` } : undefined}
                                          >
                                            <img
                                              src={msg.gifUrl}
                                              alt="GIF message"
                                              className="h-full max-h-72 w-full object-cover"
                                              draggable={false}
                                              onDragStart={(e) => e.preventDefault()}
                                              onContextMenu={(e) => e.preventDefault()}
                                              style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
                                            />
                                          </div>
                                        )}
                                          {msg.content && (
                                            <div className="border-t border-white/10 bg-[#1a1d24] px-4 py-3">
                                              <p className="text-sm text-white whitespace-pre-wrap break-words">
                                                {msg.content}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                        {reactionCount > 0 && !isDeleted && (
                                          <div 
                                            onClick={() => setReactionModalData({ isOpen: true, reactions: msg.reactions })}
                                            className={`absolute -bottom-2 ${isMe ? '-left-2' : '-right-2'} bg-[#15181e] border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm z-10 cursor-pointer hover:bg-white/10 transition-colors`}
                                          >
                                            <span>{uniqueReactions.join(' ')}</span>
                                            {reactionCount > 1 && <span className="text-[10px] font-bold text-primary-500">{reactionCount}</span>}
                                          </div>
                                        )}
                                      </div>
                                      <div className={`mt-1 flex items-center gap-1 px-0.5 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                        {msg.isEdited && !isDeleted && (
                                          <span>Edited</span>
                                        )}
                                        <span>
                                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        {isMe ? (
                                          <MessageReceiptIcon status={getMessageReceiptStatus(msg)} className="shrink-0" />
                                        ) : null}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`flex min-w-0 ${shouldUsePosterWidthForText ? 'w-[180px] max-w-[180px]' : 'max-w-[180px]'} flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} ${isDeleted ? 'opacity-50 italic' : ''}`}>
                                      <div className={`relative ${shouldUsePosterWidthForText ? 'w-full' : 'w-auto'} max-w-full min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5'}`}>
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                          {msg.content.length > 1000 && !expandedMessages.has(msg.id) 
                                            ? msg.content.substring(0, 1000) + '... ' 
                                            : msg.content + ' '}
                                          {msg.content.length > 1000 && (
                                            <button 
                                              onClick={() => toggleExpand(msg.id)}
                                              className="text-primary-400 font-bold hover:underline"
                                            >
                                              {expandedMessages.has(msg.id) ? 'Read less' : 'Read more'}
                                            </button>
                                          )}
                                        </p>

                                        {reactionCount > 0 && !isDeleted && (
                                          <div 
                                            onClick={() => setReactionModalData({ isOpen: true, reactions: msg.reactions })}
                                            className={`absolute -bottom-3 ${isMe ? '-left-2' : '-right-2'} bg-[#1a1d24] rounded-full px-1.5 py-0.5 border border-white/10 text-xs shadow-md z-10 cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-1`}
                                          >
                                            <span>{uniqueReactions.join(' ')}</span>
                                            {reactionCount > 1 && <span className="text-[10px] font-bold text-primary-500">{reactionCount}</span>}
                                          </div>
                                        )}
                                      </div>

                                      <div className={`mt-1 flex items-center gap-1 px-0.5 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                        {msg.isEdited && !isDeleted && (
                                          <span>Edited</span>
                                        )}
                                        <span>
                                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                        {isMe ? (
                                          <MessageReceiptIcon status={getMessageReceiptStatus(msg)} className="shrink-0" />
                                        ) : null}
                                      </div>
                                    </div>
                                  )}

                            {/* Reaction Hover Menu for Receiver's Messages */}
                            {!isMe && !isDeleted && !msg.id.startsWith('temp-') && (
                              <div className={`flex items-center gap-2 transition-opacity ${activeMessageId === msg.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
                            <div className="flex gap-1 bg-[#252a34] rounded-full px-2 py-1 border border-white/5 shadow-lg">
                              {['❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReact(msg.id, emoji); closeMessageActions(); }} className="hover:scale-125 transition-transform p-0.5 text-sm">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                              </div>
                            )}
                      </div>
                    </div>

                    {isMe && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden mb-5 shadow-sm">
                        {currentUser?.avatar ? (
                          <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-xs font-bold">{currentUser?.name?.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    )}
                  </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} className="h-1 shrink-0" />
        </div>

        {/* Input */}
        <div className="p-4 bg-[#1a1d24] border-t border-white/10 shrink-0">
          {isBlocked ? (
            <div className="flex flex-col items-center justify-center py-2">
              <p className="text-gray-400 text-sm mb-3">
                {isBlockedByMe ? "You blocked this person" : "You can't send a message to this person."}
              </p>
              {isBlockedByMe && (
                <button
                  onClick={async () => {
                    if (!targetUser) return;
                    // Optimistic update
                    setTargetUser((prev: any) => ({ ...prev, isBlockedByMe: false }));
                    try {
                      await fetch(`/api/users/${targetUser.username}/block`, { method: 'POST' });
                    } catch (e) {
                      console.error('Failed to unblock', e);
                      setTargetUser((prev: any) => ({ ...prev, isBlockedByMe: true })); // Revert on failure
                    }
                  }}
                  className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  Unblock
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex flex-col gap-1.5 relative">
              {isOverMessageLimit && (
                <p className="text-xs text-primary-500 px-1">
                  Message must be 1000 characters or fewer.
                </p>
              )}
              {selectedGif && !editingMessageId && (
                <SelectedGifPreview gif={selectedGif} onClear={() => setSelectedGif(null)} className="max-w-sm" />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={`flex min-h-[46px] flex-1 items-center gap-2 rounded-[24px] border bg-[#252a34] pl-5 pr-2 focus-within:ring-1 focus-within:ring-primary-500 ${
                    editingMessageId ? 'border-primary-500 shadow-[0_0_10px_rgba(229,9,20,0.2)]' : 'border-white/5'
                  }`}
                >
                  <textarea 
                    ref={messageInputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isOverMessageLimit) {
                          sendMessage(e);
                        }
                      }
                    }}
                    placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                    className="min-h-[46px] min-w-0 flex-1 resize-none bg-transparent py-3 text-sm text-white outline-none placeholder:text-gray-400 custom-scrollbar"
                    rows={1}
                  />
                  {!editingMessageId && (
                    <button
                      type="button"
                      onClick={() => setIsGifPickerOpen((prev) => !prev)}
                      className={`flex h-8 shrink-0 items-center justify-center rounded-full border px-1.5 transition-colors ${
                        isGifPickerOpen || selectedGif
                          ? 'border-primary-500/40 bg-primary-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <span
                        className={`flex h-6 items-center rounded-[8px] px-2.5 text-[11px] font-black uppercase leading-none tracking-[0.18em] ${
                          isGifPickerOpen || selectedGif
                            ? 'bg-primary-500 text-white'
                            : 'bg-[#2b313d] text-white/95'
                        }`}
                      >
                        GIF
                      </span>
                    </button>
                  )}
                </div>

                {editingMessageId ? (
                  <button 
                    type="button"
                    onClick={() => { setEditingMessageId(null); setInput(''); setSelectedGif(null); }}
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gray-600 text-white transition-colors hover:bg-gray-500"
                    title="Cancel Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                ) : null}

                <button 
                  type="submit"
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={!canSendMessage}
                  className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingMessageId ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="ml-1 w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Side Panel: Chat Info */}
      {isInfoOpen && (
        <div className="absolute xl:relative inset-y-0 right-0 z-50 xl:z-auto w-full sm:w-80 lg:w-96 border-l xl:border-l-0 border-white/10 md:border md:rounded-2xl md:shadow-2xl bg-[#15181e] flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="h-[73px] px-4 border-b border-white/10 flex justify-between items-center bg-[#1a1d24]">
            <h2 className="text-lg font-bold text-white">Chat Info</h2>
            <button onClick={() => setIsInfoOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="flex flex-col items-center text-center">
              <Link href={`/profile/${displayTargetUser?.username}`} className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden mb-4 shadow-xl hover:scale-105 transition-transform pointer-events-none">
                {displayTargetUser?.avatar ? (
                  <img src={displayTargetUser.avatar} alt={displayTargetUser.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-4xl">{displayTargetUser?.name?.charAt(0).toUpperCase()}</span>
                )}
              </Link>
              <h3 className="text-2xl font-bold text-white">{displayTargetUser?.name}</h3>
              <p className="text-gray-400">@{displayTargetUser?.username}</p>
            </div>

            <div>
               <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Options</h4>
               <div className="space-y-2">
                 <button 
                   onClick={async () => {
                     // Optimistic update
                     const newIsBlocked = !isBlockedByMe;
                     setTargetUser((prev: any) => ({ ...prev, isBlockedByMe: newIsBlocked }));
                     try {
                       await fetch(`/api/users/${targetUser.username}/block`, { method: 'POST' });
                     } catch (e) { 
                       console.error('Failed to block/unblock', e);
                       setTargetUser((prev: any) => ({ ...prev, isBlockedByMe: !newIsBlocked })); // Revert
                     }
                   }}
                   className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                 >
                   <div className={`p-2 rounded-lg ${isBlockedByMe ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-gray-400'}`}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                     </svg>
                   </div>
                   <div className="flex-1">
                     <p className="text-white font-medium">{isBlockedByMe ? 'Unblock User' : 'Block User'}</p>
                     <p className="text-xs text-gray-500">{isBlockedByMe ? 'Allow messages again' : 'Stop receiving messages'}</p>
                   </div>
                 </button>

                 <button 
                   onClick={() => {
                     setConfirmConfig({
                       isOpen: true,
                       title: 'Delete Chat',
                       message: 'Are you sure you want to delete this chat history? This action cannot be undone.',
                       confirmText: 'Delete',
                       isDestructive: true,
                       onConfirm: () => updateSettings('delete')
                     });
                   }}
                   className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                 >
                   <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </div>
                   <div className="flex-1">
                     <p className="text-white font-medium">Delete Chat</p>
                     <p className="text-xs text-gray-500">Clear all messages</p>
                   </div>
                 </button>

                 <button 
                   onClick={() => updateSettings(settings?.isMuted ? 'unmute' : 'mute')} 
                   className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                 >
                   <div className={`p-2 rounded-lg ${settings?.isMuted ? 'bg-primary-500/20 text-primary-500' : 'bg-gray-800 text-gray-400'}`}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={settings?.isMuted ? "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" : "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h2.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"} />
                     </svg>
                   </div>
                   <div className="flex-1">
                     <p className="text-white font-medium">{settings?.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</p>
                     <p className="text-xs text-gray-500">{settings?.isMuted ? 'Receive alerts for new messages' : 'Stop alerts for new messages'}</p>
                   </div>
                 </button>

                 <button 
                   onClick={() => updateSettings(settings?.isHidden ? 'unhide' : 'hide')} 
                   className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                 >
                   <div className="p-2 rounded-lg bg-gray-800 text-gray-400">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                     </svg>
                   </div>
                   <div className="flex-1">
                     <p className="text-white font-medium">{settings?.isHidden ? 'Unhide Chat' : 'Hide Chat'}</p>
                     <p className="text-xs text-gray-500">{settings?.isHidden ? 'Restore to your main chat list' : 'Move to hidden chats'}</p>
                   </div>
                 </button>

                 <button 
                   onClick={() => setConfirmConfig({
                     isOpen: true,
                     title: 'Clear Chat',
                     message: 'Delete all messages in this chat for everyone?',
                     confirmText: 'Clear All',
                     isDestructive: true,
                     onConfirm: () => updateSettings('delete')
                   })} 
                   className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-left group"
                 >
                   <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                   </div>
                   <div className="flex-1">
                     <p className="text-red-500 font-medium group-hover:text-red-400">Clear History</p>
                     <p className="text-xs text-red-500/70">Delete all messages</p>
                   </div>
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Reaction List Modal */}
      {reactionModalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#15181e] w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1d24]">
              <h2 className="text-lg font-bold text-white">Reactions</h2>
              <button onClick={() => setReactionModalData({ isOpen: false, reactions: [] })} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto space-y-3 custom-scrollbar">
              {reactionModalData.reactions.map((r, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden shrink-0">
                    {r.user?.avatar ? <img src={r.user.avatar} alt={`${r.user.name}'s avatar`} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.user?.name || 'Unknown'}</p>
                    <p className="text-gray-500 text-xs truncate">@{r.user?.username || 'unknown'}</p>
                  </div>
                  <div className="text-xl shrink-0">{r.emoji}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        isDestructive={confirmConfig.isDestructive}
      />
    </div>
  );
}
