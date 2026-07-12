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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
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

      <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelectMode && isSelected ? 'bg-primary-500/20' : isSelectMode ? 'bg-black/40 hover:bg-black/20' : ''}`}></div>

      {(isSelectMode || true) && (
        <div 
          onClick={(e) => {
            if (!isSelectMode) {
              e.stopPropagation();
              onLongPress();
            }
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[1.5px] sm:border-2 flex items-center justify-center transition-all z-10 ${
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
      )}
    </div>
  );
}
