'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLongPress } from '@/hooks/useLongPress';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

type ProfileCollection = {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  isPinned: boolean;
  _count?: {
    items?: number;
  };
};

type CollectionCardProps = {
  collection: ProfileCollection;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onLongPress: () => void;
  showPin: boolean;
};

function CollectionCard({ collection, isSelectMode, isSelected, onToggle, onLongPress, showPin }: CollectionCardProps) {
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-white rotate-[-25deg]"
          >
            <path d="M12 17v5" />
            <path d="M9 3h6l-1 5 3 3v1H7v-1l3-3-1-5Z" />
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
  isOwner = false,
  canPin = false
}: {
  myCollections: ProfileCollection[];
  savedCollections: ProfileCollection[];
  isOwner?: boolean;
  canPin?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<'my' | 'saved'>('my');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pinOverrides, setPinOverrides] = useState<Record<string, boolean>>({});
  const [deletedCollectionIds, setDeletedCollectionIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  const sortedMyCollections = useMemo(() => {
    return myCollections
      .filter((collection) => !deletedCollectionIds.has(collection.id))
      .map((collection) => ({
        ...collection,
        isPinned: pinOverrides[collection.id] ?? collection.isPinned,
      }))
      .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [deletedCollectionIds, myCollections, pinOverrides]);

  const activeCollections = activeTab === 'my' ? sortedMyCollections : savedCollections;
  const selectedCollections = useMemo(
    () => sortedMyCollections.filter((collection) => selectedIds.has(collection.id)),
    [selectedIds, sortedMyCollections]
  );
  const hasPinnedSelection = selectedCollections.some((collection) => collection.isPinned);
  const hasUnpinnedSelection = selectedCollections.some((collection) => !collection.isPinned);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
    if (newSelected.size === 0) setSelectMode(false);
  };

  const clearSelection = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchPin = async (action: 'pin' | 'unpin') => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    const previousPinOverrides = pinOverrides;
    try {
      const idsToProcess = Array.from(selectedIds);
      const nextPinnedState = action === 'pin';

      setPinOverrides((prev) => {
        const next = { ...prev };
        idsToProcess.forEach((id) => {
          next[id] = nextPinnedState;
        });
        return next;
      });

      const results = await Promise.all(idsToProcess.map(async (collectionId) => {
        const res = await fetch(`/api/collection/${collectionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });

        const data = await res.json().catch(() => ({}));

        return {
          collectionId,
          ok: res.ok,
          premiumRequired: Boolean(data.premiumRequired),
        };
      }));

      const failedIds = results.filter((result) => !result.ok).map((result) => result.collectionId);
      const premiumRequired = results.some((result) => result.premiumRequired);

      if (failedIds.length > 0) {
        setPinOverrides((prev) => {
          const next = { ...prev };
          failedIds.forEach((id) => {
            if (id in previousPinOverrides) {
              next[id] = previousPinOverrides[id];
            } else {
              delete next[id];
            }
          });
          return next;
        });
      }

      if (premiumRequired) {
        alert('Pro membership required to pin collections.');
      } else if (failedIds.length > 0) {
        alert(`Failed to ${action} ${failedIds.length === idsToProcess.length ? 'the selected collections' : 'some selected collections'}.`);
      }

      if (failedIds.length === 0 || failedIds.length !== idsToProcess.length) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          failedIds.forEach((id) => next.delete(id));
          return next;
        });

        if (failedIds.length === 0) {
          clearSelection();
        }
      }

      router.refresh();
    } catch (error) {
      setPinOverrides(previousPinOverrides);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0 || !isOwner) return;

    const idsToDelete = Array.from(selectedIds);

    setIsProcessing(true);
    const previousDeletedCollectionIds = deletedCollectionIds;

    try {
      setDeletedCollectionIds((prev) => {
        const next = new Set(prev);
        idsToDelete.forEach((id) => next.add(id));
        return next;
      });

      const results = await Promise.all(idsToDelete.map(async (collectionId) => {
        const res = await fetch(`/api/collection/${collectionId}`, {
          method: 'DELETE',
        });

        return {
          collectionId,
          ok: res.ok,
        };
      }));

      const failedIds = results.filter((result) => !result.ok).map((result) => result.collectionId);

      if (failedIds.length > 0) {
        setDeletedCollectionIds((prev) => {
          const next = new Set(prev);
          failedIds.forEach((id) => next.delete(id));
          return next;
        });
        alert(`Failed to delete ${failedIds.length === idsToDelete.length ? 'the selected collections' : 'some selected collections'}.`);
      }

      if (failedIds.length === 0 || failedIds.length !== idsToDelete.length) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          failedIds.forEach((id) => next.delete(id));
          return next;
        });

        if (failedIds.length === 0) {
          clearSelection();
        }
      }

      router.refresh();
    } catch (error) {
      setDeletedCollectionIds(previousDeletedCollectionIds);
      console.error('Failed to delete collections', error);
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
          
          {activeCollections.length > 0 && activeTab === 'my' && isOwner && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <button 
                onClick={() => {
                  setSelectMode(!selectMode);
                  if (selectMode) clearSelection();
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
              {activeCollections.map((collection) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  isSelectMode={selectMode}
                  isSelected={selectedIds.has(collection.id)}
                  onToggle={() => toggleSelection(collection.id)}
                  onLongPress={() => {
                    if (!selectMode && activeTab === 'my' && isOwner) {
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
                onClick={clearSelection}
                className="p-2 sm:px-4 sm:py-2 rounded-xl text-gray-300 hover:bg-white/5 transition-colors font-medium text-sm flex items-center justify-center"
                title="Cancel"
              >
                <span className="hidden sm:inline">Cancel</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              {canPin && (
                <>
                  <button 
                    onClick={() => handleBatchPin('pin')}
                    disabled={selectedIds.size === 0 || isProcessing || !hasUnpinnedSelection}
                    className="p-2 sm:px-4 sm:py-2 rounded-xl bg-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                    title="Pin"
                  >
                    <span className="hidden sm:inline">{isProcessing ? '...' : 'Pin'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:hidden">
                      <path d="M12 17v5"/><path d="M9 3h6l-1 5 3 3v1H7v-1l3-3-1-5Z"/>
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => handleBatchPin('unpin')}
                    disabled={selectedIds.size === 0 || isProcessing || !hasPinnedSelection}
                    className="p-2 sm:px-4 sm:py-2 rounded-xl bg-gray-500/20 text-gray-300 hover:bg-gray-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                    title="Unpin"
                  >
                    <span className="hidden sm:inline">{isProcessing ? '...' : 'Unpin'}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:hidden">
                      <path d="M12 17v5"/><path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89"/><path d="m2 2 20 20"/><path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/>
                    </svg>
                  </button>
                </>
              )}

              <button 
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={selectedIds.size === 0 || isProcessing}
                className="p-2 sm:px-4 sm:py-2 rounded-xl bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-colors font-medium text-sm disabled:opacity-50 flex items-center justify-center"
                title="Delete"
              >
                <span className="hidden sm:inline">{isProcessing ? '...' : 'Delete'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:hidden">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleBatchDelete}
        title="Delete collections?"
        message={`Delete ${selectedIds.size} collection${selectedIds.size === 1 ? '' : 's'}? This cannot be undone.`}
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
};
