'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import { useRouter } from 'next/navigation';

function CollectionCard({ collection, isSelectMode, isSelected, onToggle, onLongPress, showPin }: any) {
  const router = useRouter();

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
          draggable={false}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#252a34] to-[#1a1d24]">
          <svg className="w-12 h-12 text-white/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
          </svg>
          <span className="text-gray-500 font-medium text-sm">{collection._count?.items || 0} items</span>
        </div>
      )}

      {showPin && collection.isPinned && (
        <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg border border-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
            <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0L6.2 7.26a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" clipRule="evenodd" />
            <path d="M5.273 4.5a1.25 1.25 0 00-1.205.918l-1.523 5.52c-.006.024-.01.048-.015.072v.011l-.01.136c-.005.061-.005.127-.005.243 0 1.257.9 2.302 2.107 2.463l.117.012 3.193.308A4.244 4.244 0 0010 15.5a4.244 4.244 0 001.966-.481l3.31.32.069.006c1.173.09 2.155-.918 2.155-2.106 0-.116 0-.182-.005-.243l-.01-.136a.782.782 0 00-.015-.072l-1.523-5.52a1.25 1.25 0 00-1.205-.918H5.273z" />
          </svg>
        </div>
      )}

      <div className={`absolute inset-0 transition-colors pointer-events-none ${isSelectMode && isSelected ? 'bg-primary-500/20' : isSelectMode ? 'bg-black/40 hover:bg-black/20' : ''}`}></div>

      {(isSelectMode || showPin) && (
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 pointer-events-none">
        <span className="text-white font-bold text-base md:text-lg line-clamp-1">{collection.name}</span>
        {collection.description && <span className="text-gray-300 text-xs md:text-sm line-clamp-1 mt-1">{collection.description}</span>}
      </div>
    </div>
  );
}

export const ProfileTabs = ({
  myCollections,
  savedCollections,
  canPin = false
}: {
  myCollections: any[];
  savedCollections: any[];
  canPin?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const sortedMyCollections = useMemo(() => {
    return [...myCollections].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [myCollections]);

  const activeCollections = activeTab === 'my' ? sortedMyCollections : savedCollections;

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
    if (newSelected.size === 0) setSelectMode(false);
  };

  const handleBatchPin = async (action: 'pin' | 'unpin') => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const idsToProcess = Array.from(selectedIds);
      let premiumRequired = false;

      for (const collectionId of idsToProcess) {
        const res = await fetch(`/api/collection/${collectionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        const data = await res.json();
        if (data.premiumRequired) {
          premiumRequired = true;
          break; // Stop processing if premium required
        }
      }

      if (premiumRequired) {
        alert("Pro membership required to pin collections.");
      }

      setSelectMode(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full relative">
      <div className="border-t border-white/10 mb-8">
        <div className="flex relative">
          <button
            onClick={() => { setActiveTab('my'); setSelectMode(false); setSelectedIds(new Set()); }}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-t-2 transition-colors duration-200 ${
              activeTab === 'my' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>MY<span className="hidden sm:inline"> COLLECTIONS</span></span>
          </button>
          
          <button
            onClick={() => { setActiveTab('saved'); setSelectMode(false); setSelectedIds(new Set()); }}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 border-t-2 transition-colors duration-200 ${
              activeTab === 'saved' ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <span>SAVED<span className="hidden sm:inline"> COLLECTIONS</span></span>
          </button>
          
          {activeCollections.length > 0 && activeTab === 'my' && canPin && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <button 
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) setSelectedIds(new Set());
                }}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectMode ? 'bg-primary-500 text-white' : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {selectMode ? 'Cancel' : 'Select'}
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
          {activeCollections.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pb-24 md:pb-0">
              {activeCollections.map((collection: any) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  isSelectMode={selectMode}
                  isSelected={selectedIds.has(collection.id)}
                  onToggle={() => toggleSelection(collection.id)}
                  onLongPress={() => {
                    if (!selectMode && activeTab === 'my' && canPin) {
                      setSelectMode(true);
                      setSelectedIds(new Set([collection.id]));
                    }
                  }}
                  showPin={activeTab === 'my' && canPin}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-12">
              <p>{activeTab === 'my' ? 'No collections yet.' : 'No saved collections yet.'}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectMode && activeTab === 'my' && (
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
                onClick={() => { setSelectMode(false); setSelectedIds(new Set()); }}
                className="p-2 sm:px-4 sm:py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors font-medium text-sm flex items-center justify-center"
                title="Cancel"
              >
                <span className="hidden sm:inline">Cancel</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <button 
                onClick={() => handleBatchPin('pin')}
                disabled={selectedIds.size === 0 || isProcessing}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Pin"
              >
                <span className="hidden sm:inline">{isProcessing ? '...' : 'Pin'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              </button>
              
              <button 
                onClick={() => handleBatchPin('unpin')}
                disabled={selectedIds.size === 0 || isProcessing}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-gray-500/20 text-gray-400 hover:bg-gray-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Unpin"
              >
                <span className="hidden sm:inline">{isProcessing ? '...' : 'Unpin'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
