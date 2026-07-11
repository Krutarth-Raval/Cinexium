'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const EditCollectionModal = ({
  isOpen,
  setIsOpen,
  collectionId,
  initialName,
  initialDescription,
  initialIsPublic,
  initialThumbnail
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  collectionId: string;
  initialName: string;
  initialDescription: string;
  initialIsPublic: boolean;
  initialThumbnail: string | null;
}) => {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialThumbnail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('isPublic', isPublic ? 'true' : 'false');
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const res = await fetch(`/api/collection/${collectionId}`, {
        method: 'PUT',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update collection');
      }

      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            className="relative w-full max-w-md bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Edit Collection</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Thumbnail Upload */}
              <div className="flex flex-col items-center gap-4 mb-6">
                <div 
                  className="w-32 h-32 rounded-xl overflow-hidden bg-black/50 border border-white/10 cursor-pointer relative group flex-shrink-0"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 group-hover:text-white transition-colors">
                      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-medium">Upload Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Change</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="Collection Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
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
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
