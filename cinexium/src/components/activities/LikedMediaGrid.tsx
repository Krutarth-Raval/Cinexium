"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';

interface MediaItem {
  id: string;
  mediaId: string;
  mediaType: string;
  createdAt: Date;
  details: any;
}

export function LikedMediaGrid({ initialData }: { initialData: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initialData);
  const [sort, setSort] = useState('new');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();

  const sortedItems = useMemo(() => {
    let filtered = [...items];
    if (sort === 'movie') {
      filtered = filtered.filter(item => item.mediaType === 'movie');
    } else if (sort === 'series') {
      filtered = filtered.filter(item => item.mediaType === 'series' && !(item.details?.originalLanguage === 'ja' && item.details?.genres?.some((g: any) => g.id === 16)));
    } else if (sort === 'anime') {
      filtered = filtered.filter(item => item.mediaType === 'series' && item.details?.originalLanguage === 'ja' && item.details?.genres?.some((g: any) => g.id === 16));
    }
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sort === 'old' ? dateA - dateB : dateB - dateA;
    });
  }, [items, sort]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    if (newSelected.size === 0) setSelectMode(false);
  };

  const handleBatchRemove = async () => {
    if (selectedIds.size === 0) return;
    setIsRemoving(true);

    try {
      // Optimistic update
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
      
      const idsToRemove = Array.from(selectedIds);
      
      await Promise.all(
        idsToRemove.map(async (id) => {
          const item = items.find(i => i.id === id);
          if (!item) return;
          await fetch(`/api/media/${item.mediaId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: item.mediaType })
          });
        })
      );
      
      setSelectMode(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error('Failed to remove likes', error);
      // Revert on error could be implemented here
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="relative min-h-[50vh]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-medium">Sort by</span>
          <CustomSelect 
            value={sort}
            onChange={setSort}
            options={[
              { value: 'new', label: 'Newest First' },
              { value: 'old', label: 'Oldest First' },
              { value: 'movie', label: 'Movies Only' },
              { value: 'series', label: 'Series Only' },
              { value: 'anime', label: 'Anime Only' }
            ]}
          />
        </div>
        
        {items.length > 0 && (
          <button 
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedIds(new Set());
            }}
            className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectMode ? 'bg-primary-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {sortedItems.map((item) => (
          <MediaGridItem 
            key={item.id}
            item={item}
            isSelectMode={selectMode}
            isSelected={selectedIds.has(item.id)}
            onToggle={() => toggleSelection(item.id)}
            onLongPress={() => {
              if (!selectMode) {
                setSelectMode(true);
                setSelectedIds(new Set([item.id]));
              }
            }}
          />
        ))}
      </div>

      {sortedItems.length === 0 && (
        <div className="text-center py-12 bg-[#1a1d24] rounded-2xl border border-white/5 mt-8">
          <h3 className="text-lg font-medium text-white mb-2">No liked media found</h3>
          <p className="text-gray-400">Try changing your sort filter or like some new content.</p>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <AnimatePresence>
        {selectMode && (
            <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d24]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-4 sm:gap-6 w-[90%] sm:w-auto justify-between sm:justify-start"
          >
            <span className="text-white font-medium whitespace-nowrap text-sm sm:text-base">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-1.5 sm:gap-2">
              <button 
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="p-2 sm:px-4 sm:py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors font-medium text-sm flex items-center justify-center"
                title="Cancel"
              >
                <span className="hidden sm:inline">Cancel</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button 
                onClick={handleBatchRemove}
                disabled={selectedIds.size === 0 || isRemoving}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Remove"
              >
                <span className="hidden sm:inline">{isRemoving ? '...' : 'Remove'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MediaGridItem({ item, isSelectMode, isSelected, onToggle, onLongPress }: any) {
  const router = useRouter();

  const handleAction = () => {
    if (isSelectMode) {
      onToggle();
    } else {
      router.push(`/${item.mediaType}/${item.mediaId}`);
    }
  };

  const handlers = useLongPress(
    () => onLongPress(),
    () => handleAction(),
    { delay: 500, shouldPreventDefault: false }
  );

  return (
    <div 
      {...handlers}
      className="relative aspect-[2/3] rounded-xl overflow-hidden group cursor-pointer select-none"
    >
      {item.details?.posterUrl ? (
        <img 
          src={item.details.posterUrl} 
          alt={item.details.title} 
          className={`w-full h-full object-cover transition-transform duration-300 ${isSelected ? 'scale-105' : 'group-hover:scale-105'}`}
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-white/5 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-gray-600">
            <path fillRule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Select Mode Overlay */}
      {(isSelectMode || true) && (
        <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelectMode && isSelected ? 'bg-primary-500/20' : isSelectMode ? 'bg-black/40 hover:bg-black/20' : ''}`}>
          <div 
            onClick={(e) => {
              if (!isSelectMode) {
                e.stopPropagation();
                onLongPress();
              }
            }}
            className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[1.5px] sm:border-2 flex items-center justify-center transition-all z-10 pointer-events-auto ${
              isSelectMode 
                ? isSelected ? 'bg-primary-500 border-primary-500 opacity-100' : 'border-white/50 bg-black/20 opacity-100'
                : 'opacity-0 md:group-hover:opacity-100 hidden md:flex border-white/50 bg-black/40 hover:bg-black/60 hover:border-white'
            }`}
          >
            {isSelected && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3 h-3 sm:w-4 sm:h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </div>
        </div>
      )}
      
      {/* Title Gradient (Only in normal mode) */}
      {!isSelectMode && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2">{item.details?.title}</h3>
        </div>
      )}
    </div>
  );
}
