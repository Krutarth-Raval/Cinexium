'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivitiesView } from './ActivitiesView';

export const ActivitiesAction = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      router.push('/settings/activities');
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className="w-full flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-white/5 rounded-xl transition-colors text-left"
      >
        <div>
          <h3 className="text-white font-medium">Liked Collections</h3>
          <p className="text-gray-400 text-sm">View collections you have liked</p>
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Desktop Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 hidden md:flex">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Your Activities</h2>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto no-scrollbar">
                <ActivitiesView />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
