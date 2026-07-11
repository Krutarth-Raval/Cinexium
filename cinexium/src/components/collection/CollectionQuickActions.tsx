'use client';

import React, { useState, useEffect } from 'react';

export const CollectionQuickActions = ({ collectionId }: { collectionId: string }) => {
  const [hasLiked, setHasLiked] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // We fetch initial status. For a global search, it's better if the API returned it, 
  // but to avoid massive API changes, we can fetch on mount if visible.
  useEffect(() => {
    // In a real app, this should be returned by the search API to avoid N+1 queries.
    // For now, we'll just leave them unchecked initially to keep it simple, 
    // or you could add a dedicated endpoint. 
    setLoading(false);
  }, [collectionId]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to collection
    e.stopPropagation();
    try {
      setHasLiked(!hasLiked);
      await fetch(`/api/collection/${collectionId}/like`, { method: 'POST' });
    } catch (error) {
      setHasLiked(hasLiked); // Revert
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating
    e.stopPropagation();
    try {
      setHasSaved(!hasSaved);
      await fetch(`/api/collection/${collectionId}/save`, { method: 'POST' });
    } catch (error) {
      setHasSaved(hasSaved); // Revert
    }
  };

  if (loading) return null;

  return (
    <div className="flex gap-2 w-full mt-2 justify-center">
      <button 
        onClick={handleLike} 
        className={`p-2 rounded-full backdrop-blur-md transition-colors ${hasLiked ? 'bg-pink-500/80 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
        title="Like"
      >
        <svg className="w-4 h-4" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
      </button>
      <button 
        onClick={handleSave} 
        className={`p-2 rounded-full backdrop-blur-md transition-colors ${hasSaved ? 'bg-blue-500/80 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
        title="Save"
      >
        <svg className="w-4 h-4" fill={hasSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
      </button>
    </div>
  );
};
