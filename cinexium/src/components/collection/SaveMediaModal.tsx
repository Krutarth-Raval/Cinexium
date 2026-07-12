'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreateCollectionModal } from '@/components/profile/CreateCollectionModal';
import { useRouter } from 'next/navigation';

export const SaveMediaModal = ({ 
  isOpen, 
  onClose,
  mediaId,
  mediaType,
  onSaveSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  mediaId: string;
  mediaType: string;
  onSaveSuccess?: (isAdded: boolean, isStillSaved: boolean) => void;
}) => {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [savedCollectionIds, setSavedCollectionIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      fetchCollections();
    }
  }, [isOpen]);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/collection');
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
        
        // Find which collections this item is already in
        const savedIds = new Set<string>();
        for (const col of data) {
          try {
            const itemsRes = await fetch(`/api/collection/${col.id}/items`);
            if (itemsRes.ok) {
              const itemIds = await itemsRes.json();
              if (itemIds.includes(mediaId)) {
                savedIds.add(col.id);
              }
            }
          } catch (e) {}
        }
        setSavedCollectionIds(savedIds);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollection = async (collectionId: string) => {
    setTogglingId(collectionId);
    try {
      const res = await fetch(`/api/collection/${collectionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, mediaType })
      });
      if (res.ok) {
        const data = await res.json();
        const isAdded = data.action === 'added';
        
        setSavedCollectionIds(prev => {
          const next = new Set(prev);
          if (isAdded) next.add(collectionId);
          else next.delete(collectionId);
          return next;
        });

        if (onSaveSuccess) {
          const wasSaved = savedCollectionIds.has(collectionId);
          const nextSize = isAdded 
            ? (wasSaved ? savedCollectionIds.size : savedCollectionIds.size + 1)
            : (wasSaved ? savedCollectionIds.size - 1 : savedCollectionIds.size);
            
          onSaveSuccess(isAdded, nextSize > 0);
        }
        
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDragEnd = (e: any, info: any) => {
    if (info.offset.y > 100 || info.velocity.y > 200) {
      onClose();
    }
  };

  if (!isOpen && !isCreateModalOpen) return null;

  const renderContent = () => (
    <>
      <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>You don't have any collections yet.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8 md:pb-0">
            {collections.map(col => {
              const isSaved = savedCollectionIds.has(col.id);
              const isToggling = togglingId === col.id;
              
              return (
                <button
                  key={col.id}
                  onClick={() => toggleCollection(col.id)}
                  disabled={isToggling}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-left group"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#252a34] overflow-hidden flex-shrink-0 relative">
                    {col.thumbnail ? (
                      <img src={col.thumbnail} alt={col.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Saved Checkmark Overlay */}
                    <AnimatePresence>
                      {isSaved && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute inset-0 bg-primary-500/80 flex items-center justify-center"
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">{col.name}</h3>
                    <p className="text-xs text-gray-400">{col._count?.items || 0} items</p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {isToggling ? (
                      <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSaved ? 'border-primary-500 bg-primary-500' : 'border-gray-500 group-hover:border-white'}`}>
                        {isSaved && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-white/10 bg-[#1a1d24]">
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Create New Collection
        </button>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && !isCreateModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Mobile Bottom Drawer */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115] z-[101] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-h-[85vh]"
          >
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-white">Save to Collection</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            {renderContent()}
          </motion.div>

          {/* Desktop Centered Modal */}
          <div className="hidden md:flex fixed inset-0 z-[101] items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#0f1115] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] pointer-events-auto overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#1a1d24]">
                <h2 className="text-xl font-bold text-white">Save to Collection</h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              {renderContent()}
            </motion.div>
          </div>
        </>
      )}

      {isCreateModalOpen && (
        <CreateCollectionModal 
          isOpen={isCreateModalOpen}
          setIsOpen={(open) => {
            setIsCreateModalOpen(open);
            if (!open) fetchCollections(); // Refresh after create
          }}
          hideTrigger={true}
        />
      )}
    </AnimatePresence>
  );
};
