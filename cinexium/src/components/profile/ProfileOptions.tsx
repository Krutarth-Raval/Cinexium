'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ShareProfileModal from '@/components/profile/ShareProfileModal';
import { BlockButton } from '@/components/profile/BlockButton';

export function ProfileOptions({ 
  user,
  isBlocked
}: { 
  user: {
    id: string;
    username: string;
    name: string;
    avatar?: string | null;
  },
  isBlocked: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleDragEnd = (e: any, info: any) => {
    if (heightState === 'half') {
      if (info.offset.y < -50 || info.velocity.y < -200) {
        setHeightState('full');
      } else if (info.offset.y > 50 || info.velocity.y > 200) {
        setIsOpen(false);
      }
    } else {
      if (info.offset.y > 50 || info.velocity.y > 200) {
        setHeightState('half');
      }
    }
  };

  const handleOpenShare = () => {
    setIsOpen(false);
    setIsShareModalOpen(true);
  };

  const renderContent = () => (
    <div className="p-4 flex flex-col gap-2">
      <button 
        onClick={handleOpenShare}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-xl transition-colors text-left"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        <span className="font-medium text-white text-base">Share Profile</span>
      </button>

      <div className="w-full flex items-center justify-between p-4 bg-white/5 rounded-xl">
         <div className="flex items-center gap-4">
           <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           <span className="font-medium text-white text-base">Block User</span>
         </div>
         <BlockButton username={user.username} initiallyBlocked={isBlocked} />
      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => {
          setHeightState('half');
          setIsOpen(true);
        }} 
        className="p-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[110]"
              onClick={() => setIsOpen(false)}
            />

            {/* Mobile/Tablet Bottom Drawer */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              initial={{ height: '0vh', y: 0 }}
              animate={{ height: heightState === 'half' ? '40vh' : '80vh', y: 0 }}
              exit={{ height: '0vh', y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/80 backdrop-blur-xl z-[120] lg:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-white">Options</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
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
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-white">Options</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                {renderContent()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ShareProfileModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={user.id}
        profileUsername={user.username}
        profileName={user.name}
        profileAvatar={user.avatar || undefined}
      />
    </>
  );
}
