'use client';

import { useState, useEffect, useLayoutEffect, useRef, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/components/providers/SocketProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { GifPicker } from '@/components/gif/GifPicker';
import { SelectedGifPreview } from '@/components/gif/SelectedGifPreview';
import { ChatPageBoneyard } from '@/components/skeleton/Boneyard';
import { CollectionShareCard } from '@/components/chat/CollectionShareCard';
import { GroupInviteCard } from '@/components/chat/GroupInviteCard';
import { MediaShareCard } from '@/components/chat/MediaShareCard';
import AddMemberModal from '@/components/chat/AddMemberModal';
import ShareGroupModal from '@/components/chat/ShareGroupModal';
import { CommunityBadge } from '@/components/chat/CommunityBadge';
import { getGroupChannelName } from '@/lib/pusher';
import type { GifSelection } from '@/lib/giphy';

export default function GroupChatRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const { pusherClient } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [group, setGroup] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [input, setInput] = useState('');
  const [selectedGif, setSelectedGif] = useState<GifSelection | null>(null);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

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
  const [reactionModalData, setReactionModalData] = useState<{ isOpen: boolean; reactions: any[] }>({ isOpen: false, reactions: [] });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
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

  // Group Management Modals / Side Panel
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isPermissionDropdownOpen, setIsPermissionDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchGroup = async (before?: string) => {
    try {
      const query = new URLSearchParams({ limit: '50' });
      if (before) query.set('before', before);
      const res = await fetch(`/api/chat/group/${id}?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
        setMessages((prev: any[]) => before ? [...(data.messages || []), ...prev] : (data.messages || []));
        setHasMoreMessages(Boolean(data.hasMore));
        setEditName(data.name);
      } else {
        throw new Error('Failed to load group');
      }
      
      const meRes = await fetch('/api/user/me');
      if (meRes.ok) {
        const data = await meRes.json();
        setCurrentUser(data.user);

      }
    } catch (e: any) {
      setError(e.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

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

  const isInitialScroll = useRef(true);

  useEffect(() => {
    isInitialScroll.current = true;
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (group && currentUser) {
      const myMember = group.members?.find((m: any) => m.userId === currentUser.id);
      setIsAdmin(myMember?.role === 'ADMIN');
      setIsHidden(myMember?.isHidden || false);
    }
  }, [group, currentUser]);

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
      await fetchGroup(messages[0]?.id);
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
    if (!pusherClient || !group || !currentUser) return;

    const channelName = getGroupChannelName(group.id);
    let channel = pusherClient.channel(channelName);
    if (!channel) {
      channel = pusherClient.subscribe(channelName);
    }

    const handleReceive = (data: any) => {
      if (data?.message?.groupId === group.id) {
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

    const handleUpdate = (data: any) => {
      if (data?.message?.groupId === group.id) {
        setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m));
      }
    };

    channel.bind('receiveGroupMessage', handleReceive);
    channel.bind('groupMessageUpdated', handleUpdate);
    
    return () => {
      channel?.unbind('receiveGroupMessage', handleReceive);
      channel?.unbind('groupMessageUpdated', handleUpdate);
    };
  }, [pusherClient, group, currentUser]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSendMessage || !group || !currentUser) return;
    
    const content = input.trim();
    const pendingGif = selectedGif;
    setInput('');
    setSelectedGif(null);
    setIsGifPickerOpen(false);
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
    });

    if (editingMessageId) {
      fetch('/api/chat/group/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'editGroupMessage', messageId: editingMessageId, groupId: group.id, content })
      });
      setEditingMessageId(null);
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: tempId,
      groupId: group.id,
      senderId: currentUser.id,
      content,
      gifId: pendingGif?.id ?? null,
      gifUrl: pendingGif?.url ?? null,
      gifWidth: pendingGif?.width ?? null,
      gifHeight: pendingGif?.height ?? null,
      createdAt: new Date().toISOString(),
      sender: currentUser,
      reactions: []
    }]);

    fetch('/api/chat/group/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendGroupMessage',
        groupId: group.id,
        content,
        gifId: pendingGif?.id ?? null,
        gifUrl: pendingGif?.url ?? null,
      })
    });
  };

  const handleReact = (messageId: string, reaction: string) => {
    if (!group || !currentUser) return;

    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const existingReactions = m.reactions || [];
        const otherReactions = existingReactions.filter((r: any) => r.userId !== currentUser.id);
        return {
          ...m,
          reactions: [...otherReactions, { emoji: reaction, userId: currentUser.id, user: currentUser }]
        };
      }
      return m;
    }));

    fetch('/api/chat/group/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reactGroupMessage', messageId, groupId: group.id, reaction })
    });
  };

  const handleDelete = (messageId: string) => {
    if (!group) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Message',
      message: 'Delete this message for everyone?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        fetch('/api/chat/group/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'deleteGroupMessage', messageId, groupId: group.id })
        });
      }
    });
  };

  // Group Admin actions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateInfo = async () => {
    if (!editName.trim()) return;
    setIsSavingInfo(true);
    try {
      const formData = new FormData();
      formData.append('name', editName);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetch(`/api/chat/group/${group.id}/update`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const updated = await res.json();
        setGroup(updated);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (e) { console.error(e); } finally { setIsSavingInfo(false); }
  };

  const handleUpdateMessagePermission = async (permission: string) => {
    try {
      const res = await fetch(`/api/chat/group/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateMessagePermission', messagePermission: permission })
      });
      if (res.ok) {
        const updated = await res.json();
        setGroup(updated);
      }
    } catch (e) { console.error(e); }
  };

  const handleMemberAction = (targetUserId: string, action: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Action',
      message: 'Are you sure?',
      confirmText: 'Confirm',
      isDestructive: action === 'kick' || action === 'demote',
      onConfirm: async () => {
    try {
      if (action === 'kick' || action === 'promote') {
        const res = await fetch(`/api/chat/group/${group.id}/member`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetUserId, action })
        });
        if (res.ok) {
          const updated = await res.json();
          setGroup(updated);
        }
      } else if (action === 'demote') {
         // Fallback to old patch endpoint for demote as member route doesn't have demote explicitly
         const res = await fetch(`/api/chat/group/${group.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setRole', memberId: targetUserId, role: 'MEMBER' })
        });
        if (res.ok) fetchGroup();
      }
      } catch (e) { console.error(e); }
    }
    });
  };

  const handleLeaveGroup = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Leave Group',
      message: 'Are you sure you want to leave this group?',
      confirmText: 'Leave',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/chat/group/${group.id}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          const data = await res.json();
          if (res.ok) router.push('/chat');
          else alert(data.error || 'Failed to leave group');
        } catch (e) { console.error(e); }
      }
    });
  };

  const handleDeleteGroup = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Group',
      message: 'Are you sure you want to delete this group? This cannot be undone and will remove the group for everyone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/chat/group/${group.id}`, { method: 'DELETE' });
          if (res.ok) router.push('/chat');
          else {
            const data = await res.json();
            alert(data.error || 'Failed to delete group');
          }
        } catch (e) { console.error(e); }
      }
    });
  };

  const handleToggleHide = async () => {
    try {
      const res = await fetch(`/api/chat/group/${group.id}/hide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !isHidden })
      });
      if (res.ok) {
        const data = await res.json();
        setIsHidden(data.isHidden);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <ChatPageBoneyard />;
  if (error || !group) return <div className="flex-1 flex items-center justify-center text-red-500 bg-[#1a1d24]">{error}</div>;



  const handleJoinGroup = async () => {
    try {
      const res = await fetch(`/api/chat/group/${group.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', inviteCode })
      });
      if (res.ok) fetchGroup();
      else {
        const data = await res.json();
        if (data.premiumRequired) {
          setConfirmConfig({
            isOpen: true,
            title: 'Cinexium Pro Required',
            message: data.error,
            confirmText: 'Upgrade Now',
            isDestructive: false,
            onConfirm: () => router.push('/premium')
          });
        } else {
          setAlertConfig({ isOpen: true, message: data.error || 'Failed to join group' });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleRequestJoin = async () => {
    try {
      const res = await fetch(`/api/chat/community/${group.id}/request`, {
        method: 'POST',
      });
      if (res.ok) {
        setAlertConfig({ isOpen: true, message: 'Join request sent to the admin.' });
      } else {
        const data = await res.json();
        setAlertConfig({ isOpen: true, message: data.error || 'Failed to send request.' });
      }
    } catch (e) { console.error(e); }
  };

  // Group messages by Date
  const groupedMessages: { [date: string]: any[] } = {};
  messages.forEach(msg => {
    const d = new Date(msg.createdAt || Date.now());
    const dateStr = d.toDateString();
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
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 md:rounded-2xl md:border md:border-white/10 md:shadow-2xl overflow-hidden bg-[#111318] relative">
        {!editingMessageId && group?.isMember && (
          <GifPicker
            isOpen={isGifPickerOpen}
            mode="drawer"
            variant="comment"
            onClose={() => setIsGifPickerOpen(false)}
            onSelect={(gif) => setSelectedGif(gif)}
          />
        )}
        {!group.isMember ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/40 backdrop-blur-sm z-10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 mb-6 flex items-center justify-center shadow-xl">
              {group.avatar ? <img src={group.avatar} className="w-full h-full object-cover rounded-full" /> : <span className="text-4xl text-white font-bold">{group.name.charAt(0)}</span>}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-3xl font-bold text-white">{group.name}</h2>
              {group.isPremiumOnly && <CommunityBadge iconSize="w-8 h-8" />}
            </div>
            <p className="text-gray-400 mb-8 text-center max-w-md">
              {group.isCommunity 
                ? 'You are not a member of this community. Join to participate and see previous messages.' 
                : 'You are not a member of this group. Join to participate in the conversation and see previous messages.'}
            </p>
            {group.isCommunity && !group.isPublic && !inviteCode ? (
              <button onClick={handleRequestJoin} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg text-lg border border-white/20">
                Request to Join
              </button>
            ) : (
              <button onClick={handleJoinGroup} className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg text-lg">
                {group.isCommunity ? 'Join Community' : 'Join Group'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full min-h-0 relative">
            {/* Header */}
            <div className="relative">
              <button 
                onClick={() => setIsGroupInfoOpen(!isGroupInfoOpen)}
                className="w-full h-[73px] px-4 border-b border-white/10 flex items-center justify-between bg-[#1a1d24] z-10 shrink-0 hover:bg-white/5 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div onClick={e => e.stopPropagation()} className="flex items-center">
                    <Link href="/chat" className="md:hidden text-gray-400 hover:text-white mr-1">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </Link>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold">{group.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-medium truncate">{group.name}</p>
                      {group.isPremiumOnly && <CommunityBadge iconSize="w-4 h-4" />}
                    </div>
                    <p className="text-xs text-gray-400">{group.members.length} members</p>
                  </div>
                </div>
                
                <div className={`transition-transform duration-300 ${isGroupInfoOpen ? 'rotate-180' : ''}`}>
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
              className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar"
            >
              <div className="flex-1 min-h-[1rem]" />
              {isLoadingOlderMessages && (
                <div className="flex justify-center py-3">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
               
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-gray-500 text-sm py-10">
                  Start the conversation in {group.name}!
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
                        const isMe = msg.senderId === currentUser.id;
                        const isDeleted = msg.isDeletedForEveryone;
                        const hasGif = Boolean(msg.gifUrl);
                        const isGroupInvite = typeof msg.content === 'string' && msg.content.startsWith('[GROUP_INVITE]:');
                        const isCollectionShare = typeof msg.content === 'string' && msg.content.startsWith('[COLLECTION_SHARE]:');
                        const isEditableTextMessage = !hasGif && !isGroupInvite && !isCollectionShare;
                        const shouldUsePosterWidthForText = typeof msg.content === 'string' && (
                          msg.content.includes('\n') || msg.content.trim().length > 18
                        );
                        
                        const uniqueReactions = msg.reactions ? Array.from(new Set(msg.reactions.map((r: any) => r.emoji))) : [];
                        const reactionCount = msg.reactions?.length || 0;

                        return (
                          <div key={msg.id} className={`flex group ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                            {!isMe && (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex-shrink-0 overflow-hidden self-end mb-5 flex items-center justify-center">
                                {!msg.sender?.isBlocked && msg.sender?.avatar ? (
                                  <img src={msg.sender.avatar} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white text-xs font-bold">{msg.sender?.isBlocked ? '@' : (msg.sender?.name || msg.sender?.username || '').charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                            )}
                            
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                              {!isMe && (
                                <div className="flex items-center gap-2 mb-1 ml-1">
                                  <span className="text-xs text-gray-500">{msg.sender?.isBlocked ? '@cinexium_user' : (msg.sender?.name || `@${msg.sender?.username}`)}</span>
                                  {msg.sender?.isPremium && (
                                    <span className="text-[10px] font-bold text-fuchsia-400 bg-fuchsia-500/10 px-1.5 py-0.5 rounded border border-fuchsia-500/20 shadow-[0_0_8px_rgba(217,70,239,0.3)] tracking-wider">PRO</span>
                                  )}
                                </div>
                              )}
                              
                              <div 
                              className="flex group items-center gap-2 relative min-w-0"
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
                                {isMe && !isDeleted && !msg.id.startsWith('temp-') && (
                                  <div className={`flex items-center gap-2 transition-opacity ${activeMessageId === msg.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'}`}>
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
                                    return <GroupInviteCard meta={meta} isMe={isMe} timestamp={msg.createdAt} uniqueReactions={uniqueReactions as any} reactionCount={reactionCount} />;
                                  } catch(e) {
                                    return (
                                      <div className={`flex min-w-0 ${shouldUsePosterWidthForText ? 'w-[180px] max-w-[180px]' : 'max-w-[180px]'} flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                        <div className={`relative ${shouldUsePosterWidthForText ? 'w-full' : 'w-auto'} max-w-full min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5'}`}>
                                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                        </div>
                                        <div className={`mt-1 flex items-center gap-4 px-2 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                          <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                })() : isCollectionShare ? (() => {
                                  try {
                                    const meta = JSON.parse(msg.content.substring(19));
                                    const isMedia = meta.creatorUsername?.startsWith('Cinexium') && meta.itemCount === 0;
                                    if (isMedia) {
                                      return <MediaShareCard meta={meta} isMe={isMe} timestamp={msg.createdAt} uniqueReactions={uniqueReactions as any} reactionCount={reactionCount} />;
                                    }
                                    return <CollectionShareCard meta={meta} isMe={isMe} timestamp={msg.createdAt} uniqueReactions={uniqueReactions as any} reactionCount={reactionCount} />;
                                  } catch(e) {
                                    return (
                                      <div className={`flex min-w-0 ${shouldUsePosterWidthForText ? 'w-[180px] max-w-[180px]' : 'max-w-[180px]'} flex-col ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                                        <div className={`relative ${shouldUsePosterWidthForText ? 'w-full' : 'w-auto'} max-w-full min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5'}`}>
                                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                        </div>
                                        <div className={`mt-1 flex items-center gap-4 px-2 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                          <span>{new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
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
                                    <div className={`mt-1 flex items-center gap-4 px-2 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                      {msg.isEdited && !isDeleted && <span>Edited</span>}
                                      <span>
                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                      </span>
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
                                          className="text-primary-400 font-bold hover:underline focus:outline-none"
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

                                    <div className={`mt-1 flex items-center gap-4 px-2 text-[10px] text-white/50 ${isMe ? 'self-end justify-end' : 'self-start justify-start'}`}>
                                      {msg.isEdited && !isDeleted && <span>Edited</span>}
                                      <span>
                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  </div>
                                )}

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
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex-shrink-0 overflow-hidden self-end mb-1 flex items-center justify-center">
                                {currentUser?.avatar ? (
                                  <img src={currentUser.avatar} className="w-full h-full object-cover" />
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
            {group.isCommunity && !isAdmin && (
              (group.messagePermission === 'ADMIN_ONLY') || 
              (group.messagePermission === 'PREMIUM_ONLY' && !currentUser.isPremium)
            ) ? (
              <div className="p-4 bg-[#1a1d24] border-t border-white/10 shrink-0 text-center text-gray-500 text-sm">
                {group.messagePermission === 'PREMIUM_ONLY' ? 'Only Pro members and admins can send messages.' : 'Only admins can send messages in this community.'}
              </div>
            ) : (
              <div className="p-4 bg-[#1a1d24] border-t border-white/10 shrink-0">
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side Panel: Group Info */}
      {isGroupInfoOpen && (
        <div className="absolute xl:relative inset-y-0 right-0 z-50 xl:z-auto w-full sm:w-80 lg:w-96 border-l xl:border-l-0 border-white/10 md:border md:rounded-2xl md:shadow-2xl bg-[#15181e] flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="h-[73px] px-4 border-b border-white/10 flex justify-between items-center bg-[#1a1d24]">
            <h2 className="text-lg font-bold text-white">Group Info</h2>
            <button onClick={() => setIsGroupInfoOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="flex flex-col items-center">
              <div 
                className={`relative w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center overflow-hidden mb-4 shadow-xl ${isAdmin ? 'cursor-pointer group' : ''}`}
                onClick={() => isAdmin && fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : group.avatar ? (
                  <img src={group.avatar} alt="Group Avatar" className="w-full h-full object-cover group-hover:brightness-50 transition-all" />
                ) : (
                  <span className="text-white font-bold text-4xl group-hover:opacity-20 transition-opacity">{group.name.charAt(0).toUpperCase()}</span>
                )}
                {isAdmin && (
                   <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                     <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   </div>
                )}
              </div>
              
              {isAdmin ? (
                <div className="w-full flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-transparent text-white text-xl text-center font-bold border-b border-white/20 focus:border-primary-500 py-1 outline-none transition-colors"
                  />
                  {(editName !== group.name || avatarPreview) && (
                    <button onClick={handleUpdateInfo} disabled={isSavingInfo} className="mt-2 w-full py-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-md">
                      {isSavingInfo ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                  {group.isCommunity && (
                    <div className="mt-4 w-full text-left relative">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 block">Who can message</label>
                      <button 
                        onClick={() => setIsPermissionDropdownOpen(!isPermissionDropdownOpen)}
                        className="w-full bg-[#1a1d24] border border-white/10 text-white text-sm rounded-lg p-3 flex items-center justify-between focus:ring-1 focus:ring-primary-500 focus:outline-none hover:bg-white/5 transition-colors"
                      >
                        <span>
                          {group.messagePermission === 'ADMIN_ONLY' ? 'Admins Only' : 
                           group.messagePermission === 'PREMIUM_ONLY' ? 'Pro Members & Admins' : 'All Members'}
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPermissionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      
                      {isPermissionDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                          <button 
                            onClick={() => { handleUpdateMessagePermission('ALL'); setIsPermissionDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${group.messagePermission === 'ALL' || !group.messagePermission ? 'bg-primary-500/10 text-primary-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                          >
                            <span>All Members</span>
                            {(group.messagePermission === 'ALL' || !group.messagePermission) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <button 
                            onClick={() => { handleUpdateMessagePermission('ADMIN_ONLY'); setIsPermissionDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${group.messagePermission === 'ADMIN_ONLY' ? 'bg-primary-500/10 text-primary-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                          >
                            <span>Admins Only</span>
                            {group.messagePermission === 'ADMIN_ONLY' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                          <button 
                            onClick={() => { handleUpdateMessagePermission('PREMIUM_ONLY'); setIsPermissionDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${group.messagePermission === 'PREMIUM_ONLY' ? 'bg-primary-500/10 text-primary-500' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                          >
                            <span>Pro Members & Admins</span>
                            {group.messagePermission === 'PREMIUM_ONLY' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <h3 className="text-2xl font-bold text-white text-center">{group.name}</h3>
                  {group.isPremiumOnly && <CommunityBadge iconSize="w-6 h-6" />}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Members ({group.members?.length || 0})</h4>
                {isAdmin && (
                  <button onClick={() => setIsAddMemberModalOpen(true)} className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md transition-colors flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {group.members?.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-xl transition-colors border border-transparent">
                    <Link href={`/profile/${m.user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                        {!m.user.isBlocked && m.user.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" /> : <div className="text-white font-bold">{m.user.isBlocked ? '@' : m.user.name.charAt(0).toUpperCase()}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-100 text-sm font-medium truncate">{m.user.isBlocked ? '@cinexium_user' : m.user.name}</p>
                        <p className="text-gray-500 text-xs truncate">@{m.user.isBlocked ? 'cinexium_user' : m.user.username}</p>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      {m.role === 'ADMIN' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20 uppercase">
                          Admin
                        </span>
                      )}
                      
                      {isAdmin && m.userId !== currentUser.id && (
                        <div className="opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#1a1d24] rounded-lg p-1 shadow-sm border border-white/5">
                          {m.role === 'MEMBER' && (
                            <button onClick={() => handleMemberAction(m.userId, 'promote')} className="p-1.5 text-gray-400 hover:text-green-500 rounded-md hover:bg-white/5" title="Promote to Admin">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </button>
                          )}
                          {m.role === 'ADMIN' && (
                            <button onClick={() => handleMemberAction(m.userId, 'demote')} className="p-1.5 text-gray-400 hover:text-orange-500 rounded-md hover:bg-white/5" title="Remove Admin Status">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6.382-7.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            </button>
                          )}
                          <button onClick={() => handleMemberAction(m.userId, 'kick')} className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-white/5" title="Remove Member">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" /></svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-3">
               <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/chat/group/${group.id}${group.inviteCode ? `?invite=${group.inviteCode}` : ''}`);
                  setAlertConfig({ isOpen: true, message: 'Link copied to clipboard!' });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left border border-white/5"
              >
                <div className="p-2 rounded-lg bg-white/5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Share Group</p>
                  <p className="text-xs text-gray-500">Copy link to invite others</p>
                </div>
              </button>
               <button onClick={handleToggleHide} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                 {isHidden ? 'Unhide Group' : 'Hide Group'}
               </button>
               <button onClick={handleLeaveGroup} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                 Leave Group
               </button>
               {isAdmin && (
                 <button onClick={handleDeleteGroup} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-colors border border-red-500/20">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   Delete Group
                 </button>
               )}
              <p className="text-xs text-gray-600 text-center">
                Group created on {new Date(group.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Reaction List Modal (Still a modal since it's just a tiny popover) */}
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

      <AddMemberModal 
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        groupId={group?.id}
        isPremiumOnly={group?.isPremiumOnly}
        onMembersAdded={fetchGroup}
      />

      <ShareGroupModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        groupId={group?.id}
        groupName={group?.name}
        groupAvatar={group?.avatar}
        memberAvatars={group?.members?.slice(0, 3).map((m: any) => m.user?.avatar).filter(Boolean) || []}
      />

      <ConfirmModal
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title="Alert"
        message={alertConfig.message}
        confirmText="OK"
        cancelText={null}
      />
    </div>
  );
}
