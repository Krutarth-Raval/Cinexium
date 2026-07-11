'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface EpisodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  episode: any | null;
}

export const EpisodeDrawer = ({ isOpen, onClose, episode }: EpisodeDrawerProps) => {
  const [mounted, setMounted] = useState(false);
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset to half when opened and lock body scroll
  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted || !episode) return null;

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
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
      {/* Title */}
      <div className="px-6 py-5 md:py-6 border-b border-white/5 bg-[#1a1d24]">
        <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 leading-tight">
          {episode.name}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 font-medium">
          Season {episode.season_number} • Episode {episode.episode_number}
        </p>
      </div>

      {/* Banner */}
      <div className="w-full aspect-video bg-[#252a34] relative overflow-hidden shrink-0 border-b border-white/5">
        {episode.still_path ? (
          <img 
            src={`https://image.tmdb.org/t/p/w1280${episode.still_path}`} 
            alt={episode.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-16 h-16 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold">No Image Available</span>
          </div>
        )}
      </div>

      {/* Stats and Info */}
      <div className="px-6 py-6 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-white/5">
          {/* IMDB Rating */}
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              <span className="text-2xl font-bold text-white">{episode.vote_average?.toFixed(1) || '0.0'}<span className="text-sm text-gray-500 font-medium">/10</span></span>
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">{episode.vote_count?.toLocaleString() || '0'} votes</p>
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
          {/* Runtime */}
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-2xl font-bold text-white">{episode.runtime || '--'}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">Minutes</p>
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block"></div>
          {/* Air Date */}
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-lg font-bold text-white mt-1">
                {episode.air_date ? new Date(episode.air_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">Air Date</p>
          </div>
        </div>

        {/* Overview */}
        <div>
          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            Overview
          </h3>
          <p className="text-gray-300 leading-relaxed">
            {episode.overview || 'No overview available for this episode.'}
          </p>
        </div>
      </div>
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
            animate={{ height: heightState === 'half' ? '50vh' : '95vh', y: 0 }}
            exit={{ height: '0vh', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/80 backdrop-blur-xl z-[100] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0 absolute top-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
              <div className="w-12 h-1.5 bg-white/50 rounded-full shadow-md" />
            </div>
            
            <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="h-full flex flex-col pt-0 overflow-hidden relative">
              {renderContent()}
            </div>
          </motion.div>

          {/* Desktop Right Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 w-[400px] xl:w-[480px] bg-[#0f1115]/80 backdrop-blur-xl z-[100] hidden md:flex flex-col border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-20">
              <button onClick={onClose} className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-black/70 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {renderContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
