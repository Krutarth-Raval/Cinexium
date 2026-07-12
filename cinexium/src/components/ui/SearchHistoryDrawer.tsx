"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const renderHistoryText = (text: string) => {
  const prefixes = [
    { prefix: 'M-', color: 'text-primary-500' },
    { prefix: 'TV-', color: 'text-blue-500' },
    { prefix: '@', color: 'text-green-500' },
    { prefix: 'C-', color: 'text-purple-500' }
  ];

  for (const p of prefixes) {
    if (text.toUpperCase().startsWith(p.prefix.toUpperCase())) {
      return (
        <>
          <span className={`font-bold ${p.color}`}>{text.substring(0, p.prefix.length)}</span>
          <span>{text.substring(p.prefix.length)}</span>
        </>
      );
    }
  }
  return <span>{text}</span>;
};

interface SearchHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchHistory: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
  onClear: () => void;
}

export function SearchHistoryDrawer({
  isOpen,
  onClose,
  searchHistory,
  onSelect,
  onRemove,
  onClear
}: SearchHistoryDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const variants = isMobile ? {
    hidden: { y: '100%', opacity: 0.5 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0.5 }
  } : {
    hidden: { x: '100%', opacity: 0.5 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0.5 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className={`fixed z-[70] bg-[#13161c]/95 backdrop-blur-3xl shadow-2xl flex flex-col ${
              isMobile 
                ? 'bottom-0 left-0 w-full rounded-t-3xl h-[85vh] border border-white/10' 
                : 'right-4 top-4 w-96 h-[calc(100vh-2rem)] rounded-3xl border border-white/10'
            }`}
          >
            {/* Drag Handle (Mobile only) */}
            {isMobile && (
              <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-6 pb-4 border-b border-white/10 ${!isMobile ? 'pt-8' : ''}`}>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Search History
              </h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={onClear}
                  className="text-xs sm:text-sm text-gray-400 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
                {!isMobile && (
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {searchHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p>No recent searches</p>
                </div>
              ) : (
                searchHistory.map((item, index) => (
                  <div 
                    key={index} 
                    className="group flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer" 
                    onClick={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="text-gray-300 group-hover:text-white transition-colors">{renderHistoryText(item)}</span>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onRemove(item); 
                      }}
                      className="text-gray-600 hover:text-red-400 p-2 transition-colors rounded-full hover:bg-white/5"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
