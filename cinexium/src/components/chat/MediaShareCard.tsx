import React from 'react';
import Link from 'next/link';
import { getMediaDetailHref, normalizeMediaDetailPath } from '@/lib/media';
import { MessageReceiptIcon, type MessageReceiptStatus } from './MessageReceiptIcon';

export const MediaShareCard = ({ 
  meta, 
  isMe, 
  timestamp,
  receiptStatus,
  uniqueReactions = [],
  reactionCount = 0
}: { 
  meta: any; 
  isMe: boolean; 
  timestamp: string | Date;
  receiptStatus?: MessageReceiptStatus;
  uniqueReactions?: string[];
  reactionCount?: number;
}) => {
  const isSeries = meta.creatorUsername === 'Cinexium:tv' || meta.creatorUsername === 'Cinexium:series';
  const linkHref = normalizeMediaDetailPath(meta.shareUrlPath) || getMediaDetailHref(isSeries ? 'series' : 'movie', meta.collectionId);

  return (
    <div className={`flex flex-col min-w-0 ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'} group`}>
      <div className="relative">
        <Link 
          href={linkHref}
          className={`block bg-[#1a1d24] border border-white/10 rounded-2xl overflow-hidden shadow-xl hover:ring-2 hover:ring-primary-500 transition-all isolate transform-gpu ${isMe ? 'rounded-br-none' : 'rounded-bl-none'}`}
          style={{ width: 180, height: 270 }}
        >
          {meta.collectionThumbnail ? (
            <img src={meta.collectionThumbnail} alt={meta.collectionName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-black/50">
              <span className="font-bold text-sm text-gray-500">{meta.collectionName}</span>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            <p className="text-white font-bold text-sm line-clamp-2 leading-tight drop-shadow-md">{meta.collectionName}</p>
          </div>
        </Link>
        
        {/* Reactions */}
        {uniqueReactions.length > 0 && (
          <div className={`absolute -bottom-2 ${isMe ? '-left-2' : '-right-2'} bg-[#15181e] border border-white/10 rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm z-10`}>
            <span>{uniqueReactions.join(' ')}</span>
            {reactionCount > 1 && <span className="text-[10px] font-bold text-primary-500">{reactionCount}</span>}
          </div>
        )}
      </div>
      
      {/* Time */}
      <div className={`mt-1 text-[10px] text-white/50 px-2 flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
        <span>{new Date(timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
        {isMe && receiptStatus ? <MessageReceiptIcon status={receiptStatus} className="shrink-0" /> : null}
      </div>
    </div>
  );
};
