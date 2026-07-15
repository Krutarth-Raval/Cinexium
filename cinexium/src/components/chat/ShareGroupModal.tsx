'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';

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

  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [heightState, setHeightState] = useState<'half' | 'full'>('half');

  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      document.body.style.overflow = 'hidden';
      fetch('/api/user/me/contacts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setContacts(data);
        })
        .catch(console.error);
    } else {
      document.body.style.overflow = '';
      setSentIds(new Set());
      setCopied(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleDragEnd = (e: any, info: any) => {
    if (heightState === 'half') {
      if (info.offset.y < -50 || info.velocity.y < -200) {
        setHeightState('full');
      } else if (info.offset.y > 50 || info.velocity.y > 200) {
        onClose();
      }
    } else {
      if (info.offset.y > 50 || info.velocity.y > 200) {
        setHeightState('half');
      }
    }
  };

  const handleShare = (targetUserId: string) => {
    if (!currentUserId || sentIds.has(targetUserId)) return;
    
    const metadata = {
      type: 'GROUP_INVITE',
      groupId,
      groupName,
      groupAvatar: groupAvatar || '',
      memberAvatars: memberAvatars || []
    };
    const content = `[GROUP_INVITE]:${JSON.stringify(metadata)}`;
    
    fetch('/api/chat/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendMessage',
        targetUserId,
        content
      })
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

  const renderHeader = () => (
    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
      <h3 className="text-xl font-bold text-white">{`Share ${groupName}`}</h3>
      <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );

  const renderContent = () => (
    <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
      <div className="mb-2">
        <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.24em] mb-4">Send to</p>
        <div
          className="grid gap-x-3 gap-y-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))' }}
        >
          
          {contacts.map(f => {
            const contact = f.follower || f;
            const isSent = sentIds.has(contact.id);
            return (
              <div 
                key={contact.id} 
                className={`flex w-full flex-col items-center gap-2 min-w-0 cursor-pointer transition-all ${isSent ? 'opacity-60' : 'hover:scale-[1.04] active:scale-95'}`}
                onClick={() => handleShare(contact.id)}
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full bg-gray-700 overflow-hidden shrink-0 shadow-sm border-2 transition-colors ${isSent ? 'border-primary-500' : 'border-white/10'}`}>
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
                <p className="text-[11px] leading-4 text-white text-center line-clamp-2 w-full px-1">{contact.name?.split(' ')[0]}</p>
              </div>
            );
          })}

          <div 
            className="flex w-full flex-col items-center gap-2 min-w-0 cursor-pointer transition-all hover:scale-[1.04] active:scale-95"
            onClick={handleCopyLink}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 transition-colors ${copied ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-[#2a2d36] border-white/10 text-white hover:bg-[#323642]'}`}>
              {copied ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              )}
            </div>
            <p className={`text-[11px] leading-4 text-center line-clamp-2 w-full px-1 ${copied ? 'text-green-500' : 'text-white'}`}>
              {copied ? 'Copied' : 'Copy Link'}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110]"
            onClick={onClose}
          />

          {/* Mobile/Tablet Bottom Drawer */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ height: '0vh', y: 0 }}
            animate={{ height: heightState === 'half' ? '50vh' : '95vh', y: 0 }}
            exit={{ height: '0vh', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/80 backdrop-blur-xl z-[120] lg:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            {renderHeader()}

            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {renderContent()}
            </div>
          </motion.div>

          {/* Desktop Side Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 w-[400px] bg-[#0f1115]/80 backdrop-blur-xl z-[120] hidden lg:flex flex-col border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
          >
            {renderHeader()}
            {renderContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
