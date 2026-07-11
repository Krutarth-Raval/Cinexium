'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CustomTrailerPlayer, CustomTrailerPlayerRef } from '@/components/media/CustomTrailerPlayer';
import { SaveMediaModal } from '@/components/collection/SaveMediaModal';
import { ShareCollectionModal } from '@/app/collection/[id]/ShareCollectionModal';
import { MediaCommentsDrawer } from '@/components/media/MediaCommentsDrawer';
import { MediaLikesDrawer } from '@/components/media/MediaLikesDrawer';

import { AnimatePresence, motion } from 'framer-motion';

export const MovieHero = ({
  mediaId,
  mediaType,
  title,
  tagline,
  overview,
  backdropPath,
  posterPath,
  trailerKey
}: any) => {
  const router = useRouter();
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isTrailerPlaying, setIsTrailerPlaying] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const playerRef = useRef<CustomTrailerPlayerRef>(null);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);
  const [isLikesDrawerOpen, setIsLikesDrawerOpen] = useState(false);

  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/media/${mediaId}/stats?type=${mediaType}`);
        const data = await response.json();
        setLikesCount(data.likesCount || 0);
        setCommentsCount(data.commentsCount || 0);
        setSharesCount(data.sharesCount || 0);
        setSavesCount(data.savesCount || 0);
        setIsLiked(data.isLiked || false);
        setIsSaved(data.isSaved || false);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, [mediaId, mediaType]);

  const handleToggleLike = async () => {
    const previousLiked = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      await fetch(`/api/media/${mediaId}/like`, {
        method: 'POST',
        body: JSON.stringify({ isLike: !previousLiked, type: mediaType })
      });
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const bannerUrl = backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : (posterPath ? `https://image.tmdb.org/t/p/original${posterPath}` : '');

  const ActionButtons = ({ isMobile = false }) => (
    <div className="flex items-center gap-3 md:gap-4 flex-wrap">
      {trailerKey && (
        <button
          onClick={() => {
            if (isPlayingTrailer) {
              playerRef.current?.togglePlay();
            } else {
              setIsPlayingTrailer(true);
            }
          }}
          className={`flex items-center justify-center gap-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg ${isMobile ? 'flex-1 py-3' : 'px-8 py-3.5'}`}
        >
          {isPlayingTrailer && isTrailerPlaying ? (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
          ) : (
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          )}
          <span>{isPlayingTrailer && isTrailerPlaying ? 'Playing' : 'Play Trailer'}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="relative w-full flex flex-col md:block md:h-[90vh] bg-[#0f1115] group pt-4 md:pt-0">

      {/* Desktop Back Button */}
      <button 
        onClick={() => router.back()} 
        className="hidden md:flex absolute top-6 left-6 lg:left-10 z-50 p-3 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full transition-all border border-white/10 shadow-xl items-center justify-center group/back"
        aria-label="Go back"
      >
        <svg className="w-5 h-5 text-white group-hover/back:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>

      {/* Mobile Title (Above Banner) */}
      <div className="md:hidden px-4 mb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 mt-0.5 hover:bg-white/10 rounded-full transition-colors shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-2xl font-black text-white tracking-tight line-clamp-2">{title}</h1>
      </div>

      {/* Media Layer (Image or Video) */}
      <div className="relative w-full aspect-video md:aspect-auto md:absolute md:inset-0 px-4 md:px-0">
        <div className="w-full h-full relative rounded-2xl md:rounded-none overflow-hidden">
          {isPlayingTrailer && trailerKey ? (
            <CustomTrailerPlayer
              ref={playerRef}
              videoId={trailerKey}
              onClose={() => setIsPlayingTrailer(false)}
              onPlayingChange={setIsTrailerPlaying}
            />
          ) : bannerUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bannerUrl})` }}
            />
          ) : null}

          {/* Gradients only on desktop to blend text */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/60 to-transparent pointer-events-none" />
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#0f1115] via-[#0f1115]/40 to-transparent pointer-events-none" />

          {/* Floating Action Buttons (Reel Style) */}
          {!isPlayingTrailer && (
            <div className="absolute right-2 bottom-3 md:right-12 md:bottom-12 z-30 flex flex-col gap-3 md:gap-6 items-center">
              {/* Like */}
              <div className="flex flex-col items-center gap-0.5 md:gap-1 group">
                <button onClick={handleToggleLike} className={`transition-transform drop-shadow-md hover:scale-110 active:scale-95 ${isLiked ? 'text-primary-500' : 'text-white hover:text-white/80'}`}>
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                <button onClick={() => setIsLikesDrawerOpen(true)} className="text-white text-[10px] md:text-sm font-bold drop-shadow-md hover:underline leading-none">
                  {Intl.NumberFormat('en-US', { notation: 'compact' }).format(likesCount)}
                </button>
              </div>
  
              {/* Comment */}
              <div className="flex flex-col items-center gap-0.5 md:gap-1 group">
                <button onClick={() => setIsCommentsDrawerOpen(true)} className="text-white transition-transform drop-shadow-md hover:scale-110 active:scale-95 hover:text-white/80">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </button>
                <span className="text-white text-[10px] md:text-sm font-bold drop-shadow-md leading-none">
                  {Intl.NumberFormat('en-US', { notation: 'compact' }).format(commentsCount)}
                </span>
              </div>
  
              {/* Share */}
              <div className="flex flex-col items-center gap-0.5 md:gap-1 group">
                <button onClick={() => setIsShareModalOpen(true)} className="text-white transition-transform drop-shadow-md hover:scale-110 active:scale-95 hover:text-white/80">
                  <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                </button>
                <span className="text-white text-[10px] md:text-sm font-bold drop-shadow-md leading-none">
                  {Intl.NumberFormat('en-US', { notation: 'compact' }).format(sharesCount)}
                </span>
              </div>
  
              {/* Save */}
              <div className="flex flex-col items-center gap-0.5 md:gap-1 group">
                <button onClick={() => setIsSaveModalOpen(true)} className="text-white transition-transform drop-shadow-md hover:scale-110 active:scale-95 hover:text-white/80">
                  {isSaved ? (
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  ) : (
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  )}
                </button>
                <span className="text-white text-[10px] md:text-sm font-bold drop-shadow-md leading-none">
                  {Intl.NumberFormat('en-US', { notation: 'compact' }).format(savesCount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="md:hidden px-4 py-4 flex flex-col gap-4">
        {tagline && <p className="text-sm font-medium text-gray-300 italic">{tagline}</p>}

        <ActionButtons isMobile={true} />
      </div>

      {/* Desktop Content Layer (Overlay) */}
      <div
        className={`hidden md:flex relative z-10 p-4 md:px-12 md:py-12 w-full flex-1 flex-col justify-end pointer-events-none md:absolute md:inset-0 transition-opacity duration-300 ${isPlayingTrailer ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="pointer-events-auto max-w-4xl">
          <h1 className="text-6xl font-black text-white mb-2 tracking-tight">{title}</h1>
          {tagline && <p className="text-2xl font-medium text-gray-300 italic mb-4">{tagline}</p>}
          <ActionButtons />
        </div>
      </div>



      <SaveMediaModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        mediaId={mediaId}
        mediaType={mediaType}
        onSaveSuccess={(isAdded, isStillSaved) => {
          setSavesCount(prev => Math.max(0, isAdded ? prev + 1 : prev - 1));
          if (isStillSaved !== undefined) setIsSaved(isStillSaved);
        }}
      />

      <ShareCollectionModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        collectionId={mediaId} // using mediaId for sharing
        collectionName={title}
        collectionThumbnail={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : ''}
        collectionItemCount={0}
        creatorUsername={`Cinexium:${mediaType}`} // generic for movies and series
        onShareSuccess={() => {
          setSharesCount(prev => prev + 1);
          fetch(`/api/media/${mediaId}/share`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: mediaType }) 
          }).catch(console.error);
        }}
      />
      <MediaCommentsDrawer
        isOpen={isCommentsDrawerOpen}
        onClose={() => setIsCommentsDrawerOpen(false)}
        mediaId={mediaId}
        mediaType={mediaType}
      />
      <MediaLikesDrawer
        isOpen={isLikesDrawerOpen}
        onClose={() => setIsLikesDrawerOpen(false)}
        mediaId={mediaId}
      />
    </div>
  );
};
