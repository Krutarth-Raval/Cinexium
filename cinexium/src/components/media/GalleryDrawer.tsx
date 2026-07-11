'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CustomTrailerPlayer } from './CustomTrailerPlayer';

interface GalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: string;
  mediaType: 'movie' | 'tv';
}

type TabType = 'posters' | 'banners' | 'videos';

export const GalleryDrawer = ({ isOpen, onClose, mediaId, mediaType }: GalleryDrawerProps) => {
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');
  const [activeTab, setActiveTab] = useState<TabType>('posters');
  
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // For Modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const loadMoreRef = useRef(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      // fetch initially only if items empty or we changed mediaId
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchItems(activeTab, 1, true);
    }
  }, [isOpen, mediaId, activeTab]);

  const fetchItems = async (tab: TabType, pageNum: number, isNewTab: boolean = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gallery/${mediaType}/${mediaId}?tab=${tab}&page=${pageNum}&limit=12`);
      const data = await res.json();
      
      if (data.results) {
        setItems(prev => isNewTab ? data.results : [...prev, ...data.results]);
        setHasMore(data.hasMore);
        setPage(data.page);
      }
    } catch (error) {
      console.error('Failed to fetch gallery', error);
    } finally {
      setIsLoading(false);
      loadMoreRef.current = false;
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
    if (nearBottom && hasMore && !isLoading && items.length > 0 && !loadMoreRef.current) {
      loadMoreRef.current = true;
      fetchItems(activeTab, page + 1);
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* Tabs */}
      <div className="grid grid-cols-3 px-6 border-b border-white/10 shrink-0 mt-2">
        {(['posters', 'banners', 'videos'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => {
              if (activeTab !== tab) {
                setActiveTab(tab);
                setItems([]);
                setHasMore(true);
                setPage(1);
              }
            }}
            className={`capitalize font-bold text-base pb-3 -mb-px border-b-2 transition-colors text-center ${
              activeTab === tab 
                ? 'border-primary-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Scrollable Gallery */}
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
        {items.length === 0 && !isLoading ? (
          <div className="text-center text-gray-500 mt-10">No {activeTab} found.</div>
        ) : (
          <div className={`grid gap-4 ${activeTab === 'posters' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2'}`}>
            {items.map((item, i) => (
              <div 
                key={`${item.file_path || item.key}-${i}`} 
                className="relative group cursor-pointer rounded-xl overflow-hidden bg-[#1a1d24]"
                onClick={() => {
                  if (activeTab === 'videos') setSelectedVideo(item.key);
                  else setSelectedImage(`https://image.tmdb.org/t/p/original${item.file_path}`);
                }}
              >
                {activeTab === 'videos' ? (
                  <div className="aspect-video relative">
                    <img 
                      src={`https://img.youtube.com/vi/${item.key}/mqdefault.jpg`} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-300 flex items-center justify-center">
                      <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-white translate-x-[1px]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs font-medium truncate">{item.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`${activeTab === 'posters' ? 'aspect-[2/3]' : 'aspect-video'} relative`}>
                    <img 
                      src={`https://image.tmdb.org/t/p/${activeTab === 'posters' ? 'w500' : 'w780'}${item.file_path}`} 
                      alt="Gallery item" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="w-full h-20 flex items-center justify-center mt-4">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
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
              className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/95 backdrop-blur-xl z-[100] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
              
              <div className="px-6 pb-2 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-xl text-white">Gallery</h3>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {renderContent()}
            </motion.div>

            {/* Desktop Right Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-4 bottom-4 right-4 w-[450px] bg-[#0f1115]/95 backdrop-blur-xl z-[100] hidden md:flex flex-col border border-white/10 shadow-2xl rounded-[32px] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#1a1d24]/50">
                <h3 className="font-bold text-xl text-white">Gallery</h3>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {renderContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/90 flex flex-col p-4"
          >
            <div className="flex justify-end shrink-0 z-10 mb-4">
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 flex items-center justify-center p-2 md:p-8">
              <img 
                src={selectedImage} 
                alt="Fullscreen" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[110] bg-black">
          <CustomTrailerPlayer 
            videoId={selectedVideo} 
            onClose={() => setSelectedVideo(null)} 
          />
        </div>
      )}
    </>
  );
};
