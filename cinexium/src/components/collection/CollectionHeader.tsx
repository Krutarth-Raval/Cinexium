'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const CollectionHeader = ({ collection, isOwner, hasLiked, hasSaved }: any) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(collection.name);
  const [description, setDescription] = useState(collection.description || '');
  const [isPublic, setIsPublic] = useState(collection.isPublic);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(collection.thumbnail);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleLike = async () => {
    // API logic to toggle like
    await fetch(`/api/collection/${collection.id}/like`, { method: 'POST' });
    router.refresh();
  };

  const handleSave = async () => {
    // API logic to toggle save
    await fetch(`/api/collection/${collection.id}/save`, { method: 'POST' });
    router.refresh();
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('isPublic', isPublic ? 'true' : 'false');
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      await fetch(`/api/collection/${collection.id}`, {
        method: 'PUT',
        body: formData,
      });
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5 relative overflow-hidden">
      {/* Background blur using thumbnail */}
      {thumbnailPreview && (
        <div className="absolute inset-0 opacity-[0.03] z-0 blur-3xl pointer-events-none">
          <img src={thumbnailPreview} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
        {/* Thumbnail Area */}
        <div 
          className={`w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-2xl overflow-hidden bg-black/50 border-2 ${isEditing ? 'border-primary-500 cursor-pointer border-dashed' : 'border-white/10'}`}
          onClick={() => isEditing && fileInputRef.current?.click()}
        >
          {thumbnailPreview ? (
            <img src={thumbnailPreview} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
              <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {isEditing && <span className="text-xs">Upload</span>}
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleThumbnailChange} className="hidden" accept="image/*" />
        </div>

        {/* Details Area */}
        <div className="flex-1 w-full">
          {isEditing ? (
            <div className="space-y-4">
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white text-xl font-bold focus:outline-none focus:border-primary-500" 
              />
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary-500 resize-none h-24" 
              />
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setIsPublic(!isPublic)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPublic ? 'bg-primary-500' : 'bg-gray-600'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-300">Public Collection</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <span>By</span>
                <Link href={`/profile/${collection.user.username}`} className="font-medium text-white hover:text-primary-500 transition-colors">
                  @{collection.user.username}
                </Link>
                <span>•</span>
                <span>{collection.isPublic ? 'Public' : 'Private'}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{collection.name}</h1>
              <p className="text-gray-300 whitespace-pre-wrap max-w-2xl">{collection.description || 'No description provided.'}</p>
            </div>
          )}

          {/* Stats & Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {!isEditing && (
              <div className="flex items-center gap-4 text-sm text-gray-400 mr-4">
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                  <span className="font-semibold text-white">{collection._count.likes}</span> likes
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                  <span className="font-semibold text-white">{collection._count.saves}</span> saves
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {isOwner ? (
                isEditing ? (
                  <>
                    <button onClick={handleUpdate} disabled={isSaving} className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-xl transition-colors">
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button onClick={() => { setIsEditing(false); setName(collection.name); setDescription(collection.description); setThumbnailPreview(collection.thumbnail); }} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors">
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors">
                    Edit Collection
                  </button>
                )
              ) : (
                <>
                  <button onClick={handleLike} className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors ${hasLiked ? 'bg-pink-500/20 text-pink-500 hover:bg-pink-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <svg className="w-5 h-5" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {hasLiked ? 'Liked' : 'Like'}
                  </button>
                  <button onClick={handleSave} className={`flex flex-1 md:flex-none items-center justify-center gap-2 px-6 py-2 rounded-xl font-medium transition-colors ${hasSaved ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                    <svg className="w-5 h-5" fill={hasSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    {hasSaved ? 'Saved' : 'Save'}
                  </button>
                </>
              )}
              {/* Share Button (Reusing group chat share visual logic) */}
              <button onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-[#252a34] hover:bg-[#323844] text-white font-medium rounded-xl transition-colors border border-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
