'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface OverviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  overview: string;
}

export const OverviewDrawer = ({ isOpen, onClose, title, overview }: OverviewDrawerProps) => {
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');

  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
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

  const renderContent = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
      <h4 className="text-lg font-bold text-white mb-4">About {title}</h4>
      <p className="text-gray-300 text-lg leading-relaxed font-medium whitespace-pre-wrap">
        {overview}
      </p>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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
            animate={{ height: heightState === 'half' ? '60vh' : '95vh', y: 0 }}
            exit={{ height: '0vh', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/80 backdrop-blur-xl z-[100] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-white">Overview</h3>
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
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1a1d24]/50">
              <h3 className="font-bold text-xl text-white">Overview</h3>
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
