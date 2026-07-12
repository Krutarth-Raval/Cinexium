'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumUpgradeBanner } from '@/components/ui/PremiumUpgradeBanner';

export const CreateCollectionModal = ({ 
  isOpen: controlledIsOpen,
  setIsOpen: controlledSetIsOpen,
  hideTrigger = false
}: {
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
  hideTrigger?: boolean;
} = {}) => {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
  const setIsOpen = controlledSetIsOpen !== undefined ? controlledSetIsOpen : setUncontrolledIsOpen;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setIsChecking(true);
      fetch('/api/collection/can-create')
        .then(res => res.json())
        .then(data => {
          if (data.canCreate === false && data.reason === 'limit_reached') {
            setCanCreate(false);
          } else {
            setCanCreate(true);
          }
        })
        .catch(() => setCanCreate(true))
        .finally(() => setIsChecking(false));
    } else {
      setCanCreate(null);
      setName('');
      setDescription('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isPublic })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create collection');
      }

      setIsOpen(false);
      setName('');
      setDescription('');
      router.refresh();
      // Optionally redirect to the new collection
      // router.push(`/collection/${data.collection.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!hideTrigger && (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex-1 md:flex-none text-center px-6 py-1.5 bg-[#252a34] hover:bg-[#323844] text-white font-semibold rounded-lg transition-colors text-sm border border-white/10"
        >
          Create Collection
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl ${canCreate === false ? 'p-0 border-0 bg-transparent' : 'p-6'}`}
            >
              {isChecking ? (
                <div className="flex justify-center items-center h-64">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : canCreate === false ? (
                <PremiumUpgradeBanner 
                  message="Free users can only create up to 3 collections. Upgrade to Pro for unlimited collections!"
                  onCancel={() => setIsOpen(false)}
                />
              ) : (
                <>
                  <h2 className="text-xl font-bold text-white mb-6">Create New Collection</h2>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                    placeholder="e.g., My Favorite Anime"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors resize-none"
                    placeholder="What's this collection about?"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-primary-500' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-white">Public Collection</p>
                    <p className="text-xs text-gray-400">
                      {isPublic ? 'Visible to others based on your profile privacy.' : 'Hidden from everyone even followers.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 px-4 rounded-xl font-medium text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 py-2 px-4 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
              </>
            )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
