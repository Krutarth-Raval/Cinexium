'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/components/providers/SocketProvider';
import ConfirmModal from '@/components/ui/ConfirmModal';
import GroupInviteCard from '@/components/chat/GroupInviteCard';

export default function ChatRoom({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();
  const { socket } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
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

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/chat/${username}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.targetUser) throw new Error('User not found');
        setTargetUser(data.targetUser);
        setCurrentUser(data.currentUser);
        setMessages(data.messages || []);
        setSettings(data.conversation || { isMuted: false, isHidden: false });
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
    fetchChat();
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !targetUser || !currentUser) return;

    const handleMessage = (data: any) => {
      // If we receive a message from the target user
      if (data?.message?.senderId === targetUser.id) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleMessageSent = (data: any) => {
      // If our message was successfully saved by WS server
      if (data?.message?.senderId === currentUser.id && 
          (data.message.conversationId === settings?.id || !settings?.id)) {
        setMessages(prev => {
          // If we have an optimistic message with the exact same content and it's missing an ID, replace it.
          // Or simpler: just add it, and filter out any temp ones.
          const filtered = prev.filter(m => !m.id.startsWith('temp-') || m.content !== data.message.content);
          return [...filtered, data.message];
        });
      }
    };

    const handleMessageUpdated = (data: any) => {
      if (data?.message) {
        setMessages(prev => prev.map(m => m.id === data.message.id ? data.message : m));
      }
    };

    socket.on('receiveMessage', handleMessage);
    socket.on('messageSent', handleMessageSent);
    socket.on('messageUpdated', handleMessageUpdated);
    
    return () => {
      socket.off('receiveMessage', handleMessage);
      socket.off('messageSent', handleMessageSent);
      socket.off('messageUpdated', handleMessageUpdated);
    };
  }, [socket, targetUser, currentUser, settings]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !targetUser || !currentUser) return;
    
    let content = input.trim();
    if (content.length > 1000) {
      content = content.substring(0, 1000);
    }
    setInput('');

    if (editingMessageId) {
      try {
        socket.emit('editMessage', {
          messageId: editingMessageId,
          targetUserId: targetUser.id,
          content
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
      senderId: currentUser.id,
      createdAt: new Date().toISOString()
    }]);

    try {
      socket.emit('sendMessage', {
        senderId: currentUser.id,
        targetUserId: targetUser.id,
        content
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (!socket || !currentUser) return;
    
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

    socket.emit('reactMessage', { messageId, reaction: emoji, targetUserId: targetUser.id, userId: currentUser.id });
  };

  const handleDelete = (messageId: string) => {
    if (!socket || !targetUser) return;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Message',
      message: 'Delete this message for everyone?',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        socket.emit('deleteMessageForEveryone', { messageId, targetUserId: targetUser.id });
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
    return <div className="flex-1 flex items-center justify-center text-gray-500">Loading chat...</div>;
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
    <div className="flex-1 flex h-full min-h-0 bg-[#1a1d24] overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 relative">
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
                <Link href={`/profile/${targetUser.username}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {targetUser.avatar ? (
                    <img src={targetUser.avatar} alt={targetUser.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold">{targetUser.name.charAt(0).toUpperCase()}</span>
                  )}
                </Link>
              </div>
              <div>
                <p className="text-white font-medium">
                  {targetUser.name}
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
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          <div className="flex-1 min-h-[1rem]" />
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 text-sm py-10">
              Say hi to {targetUser.name}!
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedMessages).map(dateStr => (
                <div key={dateStr} className="space-y-4">
                  <div className="flex justify-center sticky top-2 z-10 pointer-events-none">
                    <span className="bg-[#15181e]/80 backdrop-blur text-gray-400 text-xs px-3 py-1 rounded-full border border-white/5 shadow-sm">
                      {formatDateLabel(dateStr)}
                    </span>
                  </div>
                  
                  {groupedMessages[dateStr].map((msg: any) => {
                    const isMe = msg.senderId !== targetUser.id;
                    const isDeleted = msg.isDeletedForEveryone;
                    
                    // Get reaction representation
                    const uniqueReactions = msg.reactions ? Array.from(new Set(msg.reactions.map((r: any) => r.emoji))) : [];
                    const reactionCount = msg.reactions?.length || 0;

                    return (
                      <div key={msg.id} className={`flex group items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center overflow-hidden mb-1 shadow-sm">
                            {targetUser.avatar ? (
                              <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs font-bold">{targetUser.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%] min-w-0`}>
                          <div className="flex items-center gap-2 relative min-w-0">
                        {/* Reaction / Edit / Delete Hover Menu */}
                        {isMe && !isDeleted && !msg.id.startsWith('temp-') && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                            <div className="flex gap-1 bg-[#252a34] rounded-full px-2 py-1 border border-white/5 shadow-lg">
                              <button onClick={() => { setEditingMessageId(msg.id); setInput(msg.content); }} className="text-gray-400 hover:text-white p-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button onClick={() => handleDelete(msg.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                          </div>
                        )}

                            {msg.content.startsWith('[GROUP_INVITE]:') ? (() => {
                                    try {
                                      const meta = JSON.parse(msg.content.substring(15));
                                      return <GroupInviteCard meta={meta} isMe={isMe} timestamp={msg.createdAt} />;
                                    } catch(e) {
                                      return (
                                        <div className={`relative min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none ml-auto' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5 mr-auto'}`}>
                                          <p className="text-sm whitespace-pre-wrap break-words break-all">{msg.content}</p>
                                        </div>
                                      );
                                    }
                                  })() : (
                                    <div className={`relative min-w-0 px-4 py-2 rounded-2xl ${isMe ? 'bg-primary-600 text-white rounded-br-none ml-auto' : 'bg-[#252a34] text-white rounded-bl-none border border-white/5 mr-auto'} ${isDeleted ? 'opacity-50 italic' : ''}`}>
                                    <p className="text-sm whitespace-pre-wrap break-words break-all">
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
                          
                                    <div className="flex justify-between items-center mt-1 gap-4 opacity-70">
                                      {/* Time */}
                                      <span className="text-[10px] text-white/50">
                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                                      </span>
                             
                                      {/* Edited Badge */}
                                      {msg.isEdited && !isDeleted && (
                                        <span className="text-[10px] text-white/50">Edited</span>
                                      )}
                                    </div>

                                    {/* Reaction Badge */}
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
                                  )}

                            {/* Reaction Hover Menu for Receiver's Messages */}
                            {!isMe && !isDeleted && !msg.id.startsWith('temp-') && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1 bg-[#252a34] rounded-full px-2 py-1 border border-white/5 shadow-lg">
                              {['❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition-transform p-0.5 text-sm">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                              </div>
                            )}
                      </div>
                    </div>

                    {isMe && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center overflow-hidden mb-1 shadow-sm">
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
          <form onSubmit={sendMessage} className="flex items-center gap-2 relative">
            <div className="flex-1 relative">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder={editingMessageId ? "Edit your message..." : "Type a message..."}
                className={`w-full max-h-32 min-h-[46px] bg-[#252a34] text-white text-sm rounded-[24px] px-5 py-3 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none border custom-scrollbar ${editingMessageId ? 'border-primary-500 shadow-[0_0_10px_rgba(229,9,20,0.2)]' : 'border-white/5'}`}
                rows={1}
              />
            </div>

            {editingMessageId ? (
              <button 
                type="button"
                onClick={() => { setEditingMessageId(null); setInput(''); }}
                className="h-[46px] w-[46px] rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-white transition-colors shrink-0"
                title="Cancel Edit"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            ) : null}

            <button 
              type="submit"
              disabled={!input.trim()}
              className="h-[46px] w-[46px] rounded-full bg-primary-500 hover:bg-primary-600 flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {editingMessageId ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5 rotate-90 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side Panel: Chat Info */}
      {isInfoOpen && (
        <div className="absolute md:relative inset-y-0 right-0 z-50 md:z-auto w-full md:w-80 lg:w-96 border-l border-white/10 bg-[#15181e] flex flex-col shrink-0 overflow-hidden animate-in slide-in-from-right duration-200">
          <div className="h-[73px] px-4 border-b border-white/10 flex justify-between items-center bg-[#1a1d24]">
            <h2 className="text-lg font-bold text-white">Chat Info</h2>
            <button onClick={() => setIsInfoOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
            <div className="flex flex-col items-center text-center">
              <Link href={`/profile/${targetUser.username}`} className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center overflow-hidden mb-4 shadow-xl hover:scale-105 transition-transform">
                {targetUser.avatar ? (
                  <img src={targetUser.avatar} alt={targetUser.username} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-4xl">{targetUser.name.charAt(0).toUpperCase()}</span>
                )}
              </Link>
              <h3 className="text-2xl font-bold text-white">{targetUser.name}</h3>
              <p className="text-gray-400">@{targetUser.username}</p>
            </div>

            <div>
               <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Options</h4>
               <div className="space-y-2">
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
                    {r.user?.avatar ? <img src={r.user.avatar} alt="" className="w-full h-full object-cover" /> : null}
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
