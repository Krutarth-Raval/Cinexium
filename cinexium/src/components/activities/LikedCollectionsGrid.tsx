"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import { useRouter } from 'next/navigation';
import { CustomSelect } from '@/components/ui/CustomSelect';

export function LikedCollectionsGrid({ initialData }: { initialData: any[] }) {
  const [items, setItems] = useState(initialData);
  const [sort, setSort] = useState('new');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const router = useRouter();

  const sortedItems = useMemo(() => {
    let filtered = [...items];
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
      setItems(prev => prev.filter(i => !selectedIds.has(i.collectionId)));
      
      const idsToRemove = Array.from(selectedIds);
      
      await Promise.all(
        idsToRemove.map(async (collectionId) => {
          await fetch(`/api/collection/${collectionId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      
      setSelectMode(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error('Failed to remove likes', error);
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
              { value: 'old', label: 'Oldest First' }
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

      <div className="grid grid-cols-2 min-[380px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {sortedItems.map((item) => (
          <CollectionGridItem 
            key={item.id}
            item={item}
            isSelectMode={selectMode}
            isSelected={selectedIds.has(item.collectionId)}
            onToggle={() => toggleSelection(item.collectionId)}
            onLongPress={() => {
              if (!selectMode) {
                setSelectMode(true);
                setSelectedIds(new Set([item.collectionId]));
              }
            }}
          />
        ))}
      </div>

      {sortedItems.length === 0 && (
        <div className="text-center py-12 bg-[#1a1d24] rounded-2xl border border-white/5 mt-8">
          <h3 className="text-lg font-medium text-white mb-2">No liked collections found</h3>
          <p className="text-gray-400">Collections you like will appear here.</p>
        </div>
      )}

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
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSelectMode(false);
                  setSelectedIds(new Set());
                }}
                className="px-4 py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleBatchRemove}
                disabled={selectedIds.size === 0 || isRemoving}
                className="px-4 py-2 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50"
              >
                {isRemoving ? 'Removing...' : 'Remove'}
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
  const collection = item.collection;

  const handleAction = () => {
    if (isSelectMode) {
      onToggle();
    } else {
      router.push(`/collection/${collection.id}`);
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
      className="group relative aspect-square overflow-hidden bg-[#1a1d24] rounded-xl border border-white/5 hover:border-white/20 transition-colors cursor-pointer select-none"
    >
      {collection.thumbnail ? (
        <img
          src={collection.thumbnail}
          alt={collection.name}
          className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#252a34] to-[#1a1d24]">
          <svg
            className="w-12 h-12 text-white/20 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
          </svg>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 transition-colors ${isSelectMode && isSelected ? 'bg-primary-500/20' : isSelectMode ? 'bg-black/40 hover:bg-black/20' : ''}`}>
        <span className="text-white font-bold text-base md:text-lg line-clamp-1">
          {collection.name}
        </span>
        <span className="text-gray-300 text-xs md:text-sm line-clamp-1 mt-1">
          By @{collection.user.username}
        </span>
      </div>

      {isSelectMode && (
        <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[1.5px] sm:border-2 flex items-center justify-center transition-colors ${
          isSelected ? 'bg-primary-500 border-primary-500' : 'border-white/50 bg-black/20'
        }`}>
          {isSelected && (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="white" className="w-3 h-3 sm:w-4 sm:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
