'use client';

import { useState, useEffect } from 'react';

interface GroupInviteMeta {
  groupId: string;
  groupName: string;
  groupAvatar?: string;
  memberAvatars?: string[];
}

export const GroupInviteCard = ({ 
  meta, 
  isMe, 
  timestamp,
  uniqueReactions = [],
  reactionCount = 0
}: { 
  meta: any; 
  isMe: boolean; 
  timestamp: string | Date;
  uniqueReactions?: string[];
  reactionCount?: number;
}) => {
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    // Check if current user is already a member of this group
    fetch(`/api/chat/group/${meta.groupId}`)
      .then(res => res.json())
      .then(data => {
        if (data?.isMember) setIsMember(true);
      })
      .catch(() => {});
  }, [meta.groupId]);

  return (
    <div className={`flex flex-col min-w-0 ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} group`}>
      <div className="relative">
        <div 
          className={`bg-gradient-to-br from-[#1e2230] to-[#15181e] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}
          style={{ width: 280, height: 240 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 pb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-600 to-red-800 flex items-center justify-center overflow-hidden shrink-0 shadow-md ring-2 ring-white/10">
              {meta.groupAvatar ? (
                <img src={meta.groupAvatar} alt={meta.groupName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span className="text-white font-bold text-lg">{meta.groupName?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white truncate text-sm">{meta.groupName}</p>
              <p className="text-[11px] text-gray-400">Group Invite</p>
            </div>
          </div>
          
          {/* Member Avatars */}
          {meta.memberAvatars && meta.memberAvatars.length > 0 && (
            <div className="flex -space-x-2 px-4 pb-3">
              {meta.memberAvatars.map((av: string, i: number) => (
                <img key={i} className="inline-block h-7 w-7 rounded-full ring-2 ring-[#1e2230] object-cover" src={av} alt="Group member avatar" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ))}
            </div>
          )}
          
          {/* Spacer to push button to bottom */}
          <div className="flex-1" />
          
          {/* Join / View Button */}
          <a 
            href={`/chat/group/${meta.groupId}`}
            className={`block shrink-0 w-full text-white text-sm font-bold py-3 text-center transition-colors ${
              isMember 
                ? 'bg-white/10 hover:bg-white/15' 
                : 'bg-primary-600 hover:bg-primary-500'
            }`}
          >
            {isMember ? 'View Group' : 'Join Group'}
          </a>
        </div>

        {/* Reactions */}
        {uniqueReactions.length > 0 && (
          <div className={`absolute -bottom-2 ${isMe ? '-left-2' : '-right-2'} bg-[#15181e] border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm z-10`}>
            <span>{uniqueReactions.join(' ')}</span>
            {reactionCount > 1 && <span className="text-[10px] font-bold text-primary-500">{reactionCount}</span>}
          </div>
        )}
      </div>
      
      {/* Time */}
      <div className={`mt-1 text-[10px] text-white/50 px-2 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <span>{new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};
