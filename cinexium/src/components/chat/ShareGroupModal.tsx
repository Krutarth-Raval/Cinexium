'use client';

import React, { useState, useEffect } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useSession } from 'next-auth/react';

export default function ShareGroupModal({ 
  isOpen, 
  onClose, 
  groupId,
  groupName,
  groupAvatar,
  memberAvatars,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  memberAvatars?: string[];
}) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const { socket } = useSocket();
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  useEffect(() => {
    if (isOpen) {
      fetch('/api/user/me/contacts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setContacts(data);
        })
        .catch(console.error);
    } else {
      setSentIds(new Set());
      setCopied(false);
    }
  }, [isOpen]);

  const handleShare = (targetUserId: string) => {
    if (!socket || !currentUserId || sentIds.has(targetUserId)) return;
    
    const metadata = {
      type: 'GROUP_INVITE',
      groupId,
      groupName,
      groupAvatar: groupAvatar || '',
      memberAvatars: memberAvatars || []
    };
    const content = `[GROUP_INVITE]:${JSON.stringify(metadata)}`;
    
    socket.emit('sendMessage', { 
      senderId: currentUserId, 
      targetUserId, 
      content 
    });
    
    setSentIds(prev => new Set(prev).add(targetUserId));
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/chat/group/${groupId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-white/10 flex flex-col scale-in-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share Group</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {contacts.length > 0 ? (
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Send to</p>
            <div className="flex overflow-x-auto gap-4 pb-2 custom-scrollbar hide-scrollbar">
              {contacts.map(f => {
                const contact = f.follower || f;
                const isSent = sentIds.has(contact.id);
                return (
                  <div 
                    key={contact.id} 
                    className={`flex flex-col items-center gap-2 shrink-0 w-16 cursor-pointer transition-all ${isSent ? 'opacity-60' : 'hover:scale-105 active:scale-95'}`}
                    onClick={() => handleShare(contact.id)}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full bg-gray-700 overflow-hidden shrink-0 shadow-sm border-2 transition-colors ${isSent ? 'border-primary-500' : 'border-white/10'}`}>
                        {contact.avatar ? (
                          <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                            {contact.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {isSent && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full border-2 border-[#1a1d24] flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-white text-center truncate w-full px-1">{contact.name?.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 py-4 text-center text-gray-500 text-sm bg-white/5 rounded-xl">
            No contacts available to share with.
          </div>
        )}

        <div className="border-t border-white/10 pt-4">
          <button 
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/5"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Copy Group Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
