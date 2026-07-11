'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';

interface MediaLikesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
}

export const MediaLikesDrawer = ({ isOpen, onClose, mediaId }: MediaLikesDrawerProps) => {
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      fetchLikes();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, mediaId]);

  const fetchLikes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/media/${mediaId}/likes`);
      if (res.ok) {
        setLikes(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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

  const renderContent = () => (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 pb-24">
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : likes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No likes yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {likes.map((like) => (
            <Link 
              href={`/profile/${like.user.username}`} 
              key={like.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              {like.user.avatar ? (
                <img src={like.user.avatar} alt={like.user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold text-lg uppercase">
                  {like.user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-white">{like.user.name}</p>
                <p className="text-sm text-gray-400">@{like.user.username}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Shared) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />

          {/* Mobile Bottom Drawer */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ height: '0vh', y: 0 }}
            animate={{ height: heightState === 'half' ? '50vh' : '95vh', y: 0 }}
            exit={{ height: '0vh', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/80 backdrop-blur-xl z-[100] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <div className="px-4 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-white">Likes</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {renderContent()}
            </div>
          </motion.div>

          {/* Desktop Right Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 w-[400px] bg-[#0f1115]/80 backdrop-blur-xl z-[100] hidden md:flex flex-col border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-white">Likes</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {renderContent()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
