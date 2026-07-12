'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import { useRouter } from 'next/navigation';

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo";
  interval = seconds / 86400;
  if (interval >= 7) return Math.floor(interval / 7) + "w";
  if (interval >= 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + "m";
  return Math.floor(seconds) + "s";
}

export function CollectionItemsGrid({ 
  initialItems, 
  collectionId, 
  isOwner 
}: { 
  initialItems: any[];
  collectionId: string;
  isOwner: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const sortedItems = useMemo(() => {
    let filtered = [...items];
    return filtered.sort((a, b) => {
      if (a.pinnedAt && !b.pinnedAt) return -1;
      if (!a.pinnedAt && b.pinnedAt) return 1;
      if (a.pinnedAt && b.pinnedAt) {
        return new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime();
      }

      // Default sorting by addedAt descending
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });
  }, [items]);

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
    setIsProcessing(true);

    try {
      setItems(prev => prev.filter(i => !selectedIds.has(i.collectionItemId)));
      
      await fetch(`/api/collection/${collectionId}/items/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', itemIds: Array.from(selectedIds) })
      });
      
      setSelectMode(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error('Failed to remove items', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchPin = async (action: 'pin' | 'unpin') => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);

    try {
      setItems(prev => prev.map(item => {
        if (selectedIds.has(item.collectionItemId)) {
          return { ...item, pinnedAt: action === 'pin' ? new Date().toISOString() : null };
        }
        return item;
      }));

      await fetch(`/api/collection/${collectionId}/items/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, itemIds: Array.from(selectedIds) })
      });
      
      setSelectMode(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error('Failed to pin items', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {sortedItems.map((item: any) => (
          <Link href={`/${item.type}/${item.id}`} key={`${item.type}-${item.id}`} className="group cursor-pointer flex flex-col gap-2">
            <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5 transition-transform duration-300 group-hover:scale-105 group-hover:border-primary-500/50 bg-[#1a1d24]">
              {item.pinnedAt && (
                <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded text-[10px] font-medium text-white flex items-center gap-1 border border-white/10 shadow-lg">
                  <svg className="w-2.5 h-2.5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12l-4-4v3H3v2h15v3z" transform="rotate(-45 12 12)" />
                  </svg>
                </div>
              )}
              <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute top-2 right-2 z-10">
                <span className="px-1.5 py-0.5 border border-gray-400 bg-black/60 text-gray-300 text-[10px] rounded uppercase tracking-wider backdrop-blur-sm">
                  {item.type === 'series' ? 'Series' : 'Movie'}
                </span>
              </div>
            </div>
            <div className="w-full px-1">
              <p className="text-gray-300 font-semibold text-[11px] md:text-sm truncate group-hover:text-primary-500 transition-colors">
                {item.title}
              </p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-gray-400 text-[10px] border border-gray-700 rounded px-1">
                  {item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A'}
                </p>
                <p className="text-gray-500 text-[10px] ml-auto">
                  {item.addedAt ? formatTimeAgo(item.addedAt) : ''}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-[50vh]">
      {items.length > 0 && (
        <div className="flex justify-end mb-4">
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
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {sortedItems.map((item) => (
          <CollectionGridItem 
            key={`${item.type}-${item.id}`}
            item={item}
            isSelectMode={selectMode}
            isSelected={selectedIds.has(item.collectionItemId)}
            onToggle={() => toggleSelection(item.collectionItemId)}
            onLongPress={() => {
              if (!selectMode) {
                setSelectMode(true);
                setSelectedIds(new Set([item.collectionItemId]));
              }
            }}
          />
        ))}
      </div>

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
                onClick={() => handleBatchPin('pin')}
                disabled={selectedIds.size === 0 || isProcessing}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Pin"
              >
                <span className="hidden sm:inline">Pin</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:hidden">
                  <path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
                </svg>
              </button>
              <button 
                onClick={() => handleBatchPin('unpin')}
                disabled={selectedIds.size === 0 || isProcessing}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-gray-500/20 text-gray-300 hover:bg-gray-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Unpin"
              >
                <span className="hidden sm:inline">Unpin</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:hidden">
                  <path d="M12 17v5"/><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/>
                </svg>
              </button>
              <button 
                onClick={handleBatchRemove}
                disabled={selectedIds.size === 0 || isProcessing}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Remove"
              >
                <span className="hidden sm:inline">{isProcessing ? '...' : 'Remove'}</span>
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

function CollectionGridItem({ item, isSelectMode, isSelected, onToggle, onLongPress }: any) {
  const router = useRouter();

  const handleAction = () => {
    if (isSelectMode) {
      onToggle();
    } else {
      router.push(`/${item.type}/${item.id}`);
    }
  };

  const handlers = useLongPress(
    () => onLongPress(),
    () => handleAction(),
    { delay: 500, shouldPreventDefault: false }
  );

  return (
    <div className="flex flex-col gap-2">
      <div 
        {...handlers}
        className="group relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/5 transition-transform duration-300 hover:border-primary-500/50 bg-[#1a1d24] cursor-pointer select-none"
      >
        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
        
        {item.pinnedAt && !isSelectMode && (
          <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur-md px-1.5 py-1 rounded text-[10px] font-medium text-white flex items-center gap-1 border border-white/10 shadow-lg">
            <svg className="w-2.5 h-2.5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12l-4-4v3H3v2h15v3z" transform="rotate(-45 12 12)" />
            </svg>
          </div>
        )}
        
        <div className="absolute top-2 right-2 z-10">
          <span className="px-1.5 py-0.5 border border-gray-400 bg-black/60 text-gray-300 text-[10px] rounded uppercase tracking-wider backdrop-blur-sm">
            {item.type === 'series' ? 'Series' : 'Movie'}
          </span>
        </div>

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
      </div>
      <div className="w-full px-1 cursor-pointer" onClick={() => !isSelectMode && router.push(`/${item.type}/${item.id}`)}>
        <p className="text-gray-300 font-semibold text-[11px] md:text-sm truncate group-hover:text-primary-500 transition-colors">
          {item.title}
        </p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-gray-400 text-[10px] border border-gray-700 rounded px-1">
            {item.releaseDate ? item.releaseDate.split('-')[0] : 'N/A'}
          </p>
          <p className="text-gray-500 text-[10px] ml-auto">
            {item.addedAt ? formatTimeAgo(item.addedAt) : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
