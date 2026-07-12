import React from 'react';
import Link from 'next/link';

export const CollectionShareCard = ({ 
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
  return (
    <div className={`flex flex-col min-w-0 ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} group`}>
      <div className="relative">
        <div 
          className={`bg-[#1a1d24] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col isolate transform-gpu ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}
          style={{ width: 280, height: 240 }}
        >
          {/* Banner area */}
          <div className="flex-1 min-h-0 w-full relative bg-black/50">
            {meta.collectionThumbnail ? (
              <img src={meta.collectionThumbnail} alt={meta.collectionName} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                </svg>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent" />
            
            <div className="absolute top-3 left-3 right-3">
              <p className="text-white font-bold text-sm line-clamp-1">{meta.collectionName}</p>
              <p className="text-gray-300 text-[10px]">by {meta.creatorUsername} • {meta.itemCount} items</p>
            </div>
          </div>
          
          <Link 
            href={`/collection/${meta.collectionId}`}
            className="block shrink-0 w-full py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-bold text-center transition-colors mt-auto"
          >
            View Collection
          </Link>
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
