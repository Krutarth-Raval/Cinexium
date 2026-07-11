'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { EditCollectionModal } from './EditCollectionModal';
import { ShareCollectionModal } from './ShareCollectionModal';

export const CollectionActions = ({
  collectionId,
  initialLiked,
  initialSaved,
  initialLikeCount,
  initialSaveCount,
  isOwner,
  isMobile,
  collectionDetails,
}: {
  collectionId: string;
  initialLiked: boolean;
  initialSaved: boolean;
  initialLikeCount: number;
  initialSaveCount: number;
  isOwner?: boolean;
  isMobile?: boolean;
  collectionDetails?: {
    name: string;
    description: string;
    isPublic: boolean;
    thumbnail: string | null;
    itemCount: number;
    creatorUsername: string;
  };
}) => {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saveCount, setSaveCount] = useState(initialSaveCount);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const router = useRouter();

  const handleLike = async () => {
    if (loading) return;
    setLoading(true);
    const previousState = isLiked;
    const previousCount = likeCount;

    // Optimistic UI update
    setIsLiked(!previousState);
    setLikeCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      const res = await fetch(`/api/collection/${collectionId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // Revert on error
      setIsLiked(previousState);
      setLikeCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (loading) return;
    setLoading(true);
    const previousState = isSaved;
    const previousCount = saveCount;

    // Optimistic UI update
    setIsSaved(!previousState);
    setSaveCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      const res = await fetch(`/api/collection/${collectionId}/save`, { method: 'POST' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // Revert on error
      setIsSaved(previousState);
      setSaveCount(previousCount);
    } finally {
      setLoading(false);
    }
  };

  if (isOwner && isMobile) {
    return (
      <>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-[#1a1d24] text-white hover:bg-[#252a34] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="font-semibold">Edit</span>
          </button>

          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-[#1a1d24] text-white hover:bg-[#252a34] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span className="font-semibold">Share</span>
          </button>
        </div>

        {collectionDetails && (
          <>
            <EditCollectionModal 
              isOpen={isEditModalOpen}
              setIsOpen={setIsEditModalOpen}
              collectionId={collectionId}
              initialName={collectionDetails.name}
              initialDescription={collectionDetails.description}
              initialIsPublic={collectionDetails.isPublic}
              initialThumbnail={collectionDetails.thumbnail}
            />
            <ShareCollectionModal 
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              collectionId={collectionId}
              collectionName={collectionDetails.name}
              collectionThumbnail={collectionDetails.thumbnail}
              collectionItemCount={collectionDetails.itemCount}
              creatorUsername={collectionDetails.creatorUsername}
            />
          </>
        )}
      </>
    );
  }

  if (isOwner) {
    return (
      <>
        <div className="flex items-center gap-4 mt-6">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-[#1a1d24] text-white hover:bg-[#252a34] transition-colors"
          >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span className="font-semibold">Edit</span>
        </button>

        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-[#1a1d24] text-white hover:bg-[#252a34] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="font-semibold">Share</span>
        </button>

        <div className="flex items-center gap-4 ml-4">
          <div className="flex items-center gap-1.5 text-gray-400" title="Likes">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="font-medium text-lg">{likeCount}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-gray-400" title="Saves">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="font-medium text-lg">{saveCount}</span>
          </div>
        </div>
      </div>
      
      {collectionDetails && (
        <>
          <EditCollectionModal 
            isOpen={isEditModalOpen}
            setIsOpen={setIsEditModalOpen}
            collectionId={collectionId}
            initialName={collectionDetails.name}
            initialDescription={collectionDetails.description}
            initialIsPublic={collectionDetails.isPublic}
            initialThumbnail={collectionDetails.thumbnail}
          />
          <ShareCollectionModal 
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            collectionId={collectionId}
            collectionName={collectionDetails.name}
            collectionThumbnail={collectionDetails.thumbnail}
            collectionItemCount={collectionDetails.itemCount}
            creatorUsername={collectionDetails.creatorUsername}
          />
        </>
      )}
      </>
    );
  }

  // Non-owner mobile: 50-50 like/save with counts on buttons
  if (isMobile) {
    return (
      <>
        <div className="flex gap-3">
          <button 
            onClick={handleLike}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors ${
              isLiked 
                ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' 
                : 'bg-[#1a1d24] border-white/10 text-white hover:bg-[#252a34]'
            }`}
          >
            <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="font-semibold">{likeCount}</span>
          </button>

          <button 
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-colors ${
              isSaved 
                ? 'bg-primary-500/10 border-primary-500/50 text-primary-500 hover:bg-primary-500/20' 
                : 'bg-[#1a1d24] border-white/10 text-white hover:bg-[#252a34]'
            }`}
          >
            <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className="font-semibold">{saveCount}</span>
          </button>

          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#1a1d24] text-white hover:bg-[#252a34] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {collectionDetails && (
          <ShareCollectionModal 
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            collectionId={collectionId}
            collectionName={collectionDetails.name}
            collectionThumbnail={collectionDetails.thumbnail}
            collectionItemCount={collectionDetails.itemCount}
            creatorUsername={collectionDetails.creatorUsername}
          />
        )}
      </>
    );
  }

  // Non-owner desktop
  return (
    <div className="flex items-center gap-4 mt-6">
      <button 
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-colors ${
          isLiked 
            ? 'bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20' 
            : 'bg-[#1a1d24] border-white/10 text-white hover:bg-[#252a34]'
        }`}
      >
        <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        <span className="font-semibold">{likeCount}</span>
      </button>

      <button 
        onClick={handleSave}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-colors ${
          isSaved 
            ? 'bg-primary-500/10 border-primary-500/50 text-primary-500 hover:bg-primary-500/20' 
            : 'bg-[#1a1d24] border-white/10 text-white hover:bg-[#252a34]'
        }`}
      >
        <svg className="w-5 h-5" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        <span className="font-semibold">{saveCount}</span>
      </button>

      {/* Share button for non-owners */}
      <button 
        onClick={() => setIsShareModalOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 bg-[#1a1d24] text-white hover:bg-[#252a34] transition-colors ml-auto"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span className="font-semibold hidden sm:inline">Share</span>
      </button>

      {collectionDetails && (
        <ShareCollectionModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          collectionId={collectionId}
          collectionName={collectionDetails.name}
          collectionThumbnail={collectionDetails.thumbnail}
          collectionItemCount={collectionDetails.itemCount}
          creatorUsername={collectionDetails.creatorUsername}
        />
      )}
    </div>
  );
};
