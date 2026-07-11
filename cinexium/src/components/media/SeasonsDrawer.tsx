'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface SeasonsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  seasons: any[];
  selectedSeasonNumber: number;
  onSelectSeason: (seasonNumber: number) => void;
}

export const SeasonsDrawer = ({ isOpen, onClose, seasons, selectedSeasonNumber, onSelectSeason }: SeasonsDrawerProps) => {
  const [mounted, setMounted] = useState(false);
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!mounted) return null;

  const processedSeasons = [...seasons].sort((a, b) => {
    if (a.season_number === 0) return 1;
    if (b.season_number === 0) return -1;
    return a.season_number - b.season_number;
  }).map(s => {
    if (s.season_number === 0) return { ...s, name: 'Extras' };
    return s;
  });

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
          />

          {/* Mobile Bottom Drawer */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={(e, info) => {
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
            }}
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
              <h2 className="text-xl font-bold text-white">All Seasons</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 pb-12 custom-scrollbar">
              <div className="flex flex-col gap-3">
                {processedSeasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      onSelectSeason(season.season_number);
                      onClose();
                    }}
                    className={`flex gap-4 items-center p-3 rounded-xl transition-colors text-left ${selectedSeasonNumber === season.season_number ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                  >
                    <div className="w-16 h-24 shrink-0 bg-[#252a34] rounded-lg overflow-hidden border border-white/5">
                      {season.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} alt={season.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{season.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{season.episode_count} Episodes</p>
                      {season.air_date && <p className="text-xs text-gray-500">{new Date(season.air_date).getFullYear()}</p>}
                    </div>
                    {selectedSeasonNumber === season.season_number && (
                      <div className="shrink-0 text-primary-500">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Desktop Right Side Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 w-[500px] bg-[#0f1115]/80 backdrop-blur-xl z-[100] hidden md:flex flex-col border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1a1d24]">
              <h3 className="font-bold text-xl text-white">All Seasons</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="flex flex-col gap-4">
                {processedSeasons.map((season) => (
                  <button
                    key={season.id}
                    onClick={() => {
                      onSelectSeason(season.season_number);
                      onClose();
                    }}
                    className={`flex gap-4 items-center p-3 rounded-xl transition-colors text-left group ${selectedSeasonNumber === season.season_number ? 'bg-primary-500/20 border border-primary-500/50' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}
                  >
                    <div className="w-20 h-28 shrink-0 bg-[#252a34] rounded-lg overflow-hidden relative border border-white/5">
                      {season.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w200${season.poster_path}`} alt={season.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">{season.name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{season.episode_count} Episodes</p>
                      {season.air_date && <p className="text-xs text-gray-500">{new Date(season.air_date).getFullYear()}</p>}
                    </div>
                    {selectedSeasonNumber === season.season_number ? (
                      <div className="shrink-0 text-primary-500 pr-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    ) : (
                      <div className="shrink-0 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
