'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import type { FormEvent } from 'react';
import {
  getGifDimensions,
  GIPHY_PAGE_SIZE,
  getGifPreviewUrl,
  getGifRenderUrl,
  getGifStillUrl,
  type GifSelection,
  type GiphyGif,
  type GiphyResponse,
} from '@/lib/giphy';

type GifPickerMode = 'popover' | 'drawer';
type GifPickerVariant = 'default' | 'comment';

interface GifPickerProps {
  isOpen: boolean;
  mode: GifPickerMode;
  onClose: () => void;
  onSelect: (gif: GifSelection) => void;
  variant?: GifPickerVariant;
}

type FetchState = 'idle' | 'loading' | 'loading-more' | 'error';

const GIF_SKELETON_HEIGHTS = ['h-28', 'h-40', 'h-32', 'h-36', 'h-24', 'h-44', 'h-28', 'h-36', 'h-32'];

const dedupeGifsById = (items: GiphyGif[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

function GifPickerTile({
  gif,
  isCommentVariant,
  onSelect,
}: {
  gif: GiphyGif;
  isCommentVariant: boolean;
  onSelect: (gif: GifSelection) => void;
}) {
  const [isAnimatedLoaded, setIsAnimatedLoaded] = useState(false);
  const renderUrl = getGifRenderUrl(gif);
  const previewUrl = getGifPreviewUrl(gif);
  const stillUrl = getGifStillUrl(gif);

  return (
    <button
      type="button"
      onClick={() => {
        const dimensions = getGifDimensions(gif);
        onSelect({
          id: gif.id,
          url: renderUrl,
          width: dimensions?.width,
          height: dimensions?.height,
        });
      }}
      className={`group overflow-hidden rounded-2xl border border-white/5 bg-[#111318] text-left transition-transform hover:scale-[1.02] hover:border-primary-500/40 ${
        isCommentVariant ? 'mb-2 inline-block w-full break-inside-avoid align-top' : ''
      }`}
    >
      <div className="relative overflow-hidden bg-[#111318]">
        <img
          src={stillUrl}
          alt={gif.title || 'GIF'}
          className={`w-full object-cover transition-opacity duration-200 ${
            isAnimatedLoaded ? 'opacity-0' : 'opacity-100'
          } ${isCommentVariant ? 'h-auto' : 'h-32'}`}
          loading="eager"
          decoding="async"
          draggable={false}
        />
        <img
          src={previewUrl}
          alt={gif.title || 'GIF'}
          className={`absolute inset-0 w-full object-cover transition-opacity duration-200 ${
            isAnimatedLoaded ? 'opacity-100' : 'opacity-0'
          } ${isCommentVariant ? 'h-full' : 'h-32'}`}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setIsAnimatedLoaded(true)}
        />
      </div>
    </button>
  );
}

function GifPickerSkeletonGrid({ isCommentVariant }: { isCommentVariant: boolean }) {
  if (isCommentVariant) {
    return (
      <div className="columns-[120px] gap-2 [column-fill:_balance]">
        {GIF_SKELETON_HEIGHTS.map((height, index) => (
          <div
            key={`gif-skeleton-${index}`}
            className="mb-2 inline-block w-full break-inside-avoid overflow-hidden rounded-2xl border border-white/5 bg-[#111318]"
          >
            <div className={`w-full animate-pulse bg-white/[0.07] ${height}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {GIF_SKELETON_HEIGHTS.map((height, index) => (
        <div
          key={`gif-skeleton-${index}`}
          className="overflow-hidden rounded-2xl border border-white/5 bg-[#111318]"
        >
          <div className={`w-full animate-pulse bg-white/[0.07] ${height}`} />
        </div>
      ))}
    </div>
  );
}

function GifPickerContent({
  gifs,
  search,
  onSearchChange,
  onSearchSubmit,
  fetchState,
  hasMore,
  loadMoreRef,
  scrollContainerRef,
  onSelect,
  variant,
  showDrawerHandle,
  onHeaderPointerDown,
  onClose,
}: {
  gifs: GiphyGif[];
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  fetchState: FetchState;
  hasMore: boolean;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (gif: GifSelection) => void;
  variant: GifPickerVariant;
  showDrawerHandle?: boolean;
  onHeaderPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onClose: () => void;
}) {
  const isCommentVariant = variant === 'comment';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`border-b border-white/10 ${isCommentVariant ? 'px-2 pb-2 pt-3' : 'px-4 py-3'}`}
        onPointerDown={onHeaderPointerDown}
      >
        {showDrawerHandle && (
          <div className="flex justify-center pb-3">
            <div className="h-1.5 w-12 rounded-full bg-white/20" />
          </div>
        )}
        <form
          className={`flex items-center gap-2 ${isCommentVariant ? 'w-full' : 'w-full'}`}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onSearchSubmit();
          }}
        >
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              enterKeyHint="search"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Search GIFs"
              className="h-11 w-full rounded-2xl border border-white/10 bg-[#111318] pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          {isCommentVariant && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#111318] text-gray-400 transition-colors hover:text-white"
              aria-label="Close GIF picker"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </form>
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto ${isCommentVariant ? 'p-2' : 'p-3'}`}
      >
        {fetchState === 'loading' ? (
          <GifPickerSkeletonGrid isCommentVariant={isCommentVariant} />
        ) : fetchState === 'error' ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
            Could not load GIFs right now. Please try again.
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
            No GIFs found. Try another search.
          </div>
        ) : (
          <div className={isCommentVariant ? 'columns-[120px] gap-2 [column-fill:_balance]' : 'grid grid-cols-2 gap-3 sm:grid-cols-3'}>
            {gifs.map((gif) => {
              return (
                <GifPickerTile
                  key={`${gif.id}-${getGifPreviewUrl(gif)}`}
                  gif={gif}
                  isCommentVariant={isCommentVariant}
                  onSelect={onSelect}
                />
              );
            })}
          </div>
        )}

        <div ref={loadMoreRef} className="h-6" />

        {fetchState === 'loading-more' && (
          <div className="flex justify-center py-3">
            <div className="h-6 w-6 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          </div>
        )}

        {!hasMore && gifs.length > 0 && (
          <div className="py-3 text-center text-xs text-gray-500">
            You&apos;ve reached the end.
          </div>
        )}
      </div>
    </div>
  );
}

export function GifPicker({ isOpen, mode, onClose, onSelect, variant = 'default' }: GifPickerProps) {
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [mobileHeight, setMobileHeight] = useState<'half' | 'full'>('half');
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isLoadingMoreRef = useRef(false);
  const mobileDragControls = useDragControls();

  const handleClose = () => {
    setMobileHeight('half');
    onClose();
  };

  const submitSearch = () => {
    setSearch(searchInput.trim());
    setOffset(0);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateViewport = (event?: MediaQueryListEvent) => {
      setIsDesktopViewport(event ? event.matches : mediaQuery.matches);
    };

    updateViewport();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateViewport);
      return () => mediaQuery.removeEventListener('change', updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    const run = async () => {
      const isLoadMore = offset > 0;
      setFetchState(isLoadMore ? 'loading-more' : 'loading');

      const endpoint = search
        ? `/api/giphy?q=${encodeURIComponent(search)}&offset=${offset}`
        : `/api/giphy?offset=${offset}`;

      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        if (!response.ok) throw new Error('Failed to fetch GIFs');

        const result = (await response.json()) as GiphyResponse;
        setGifs((prev) => dedupeGifsById(isLoadMore ? [...prev, ...result.data] : result.data));
        setHasMore(result.pagination.count === GIPHY_PAGE_SIZE);
        setFetchState('idle');
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error(error);
        setFetchState('error');
        if (!isLoadMore) {
          setGifs([]);
        }
      }
    };

    void run();

    return () => controller.abort();
  }, [isOpen, offset, search]);

  useEffect(() => {
    isLoadingMoreRef.current = fetchState === 'loading' || fetchState === 'loading-more';
  }, [fetchState]);

  useEffect(() => {
    if (!isOpen || !scrollContainerRef.current || !hasMore) {
      return;
    }

    const container = scrollContainerRef.current;

    const maybeLoadMore = () => {
      if (isLoadingMoreRef.current || !hasMore) {
        return;
      }

      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;

      if (distanceFromBottom <= 220) {
        isLoadingMoreRef.current = true;
        setOffset((prev) => prev + GIPHY_PAGE_SIZE);
      }
    };

    container.addEventListener('scroll', maybeLoadMore, { passive: true });

    return () => {
      container.removeEventListener('scroll', maybeLoadMore);
    };
  }, [hasMore, isOpen, gifs.length]);

  useEffect(() => {
    if (isOpen && mode === 'drawer') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, mode]);

  const title = useMemo(() => (search ? 'Search GIFs' : 'Trending GIFs'), [search]);
  const isCommentVariant = variant === 'comment';

  const content = (
    showDrawerHandle = mode === 'drawer',
    onHeaderPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
  ) => (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-[#0f1115]/95 backdrop-blur-xl shadow-2xl ${
        mode === 'drawer' ? 'border-x border-b border-white/10' : 'border border-white/10'
      }`}
    >
      {!isCommentVariant && (
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-gray-500">20 GIFs at a time</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close GIF picker"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <GifPickerContent
        gifs={gifs}
        search={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={submitSearch}
        fetchState={fetchState}
        hasMore={hasMore}
        loadMoreRef={loadMoreRef}
        scrollContainerRef={scrollContainerRef}
        variant={variant}
        showDrawerHandle={showDrawerHandle}
        onHeaderPointerDown={onHeaderPointerDown}
        onClose={handleClose}
        onSelect={(gif) => {
          onSelect(gif);
          handleClose();
        }}
      />
    </div>
  );

  if (mode === 'popover') {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.18 }}
            className={`absolute bottom-full left-0 right-0 z-40 ${isCommentVariant ? 'mb-5 h-[24rem] max-h-[60vh]' : 'mb-3 h-[26rem] max-h-[65vh]'}`}
          >
            {content(false)}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const handleMobileDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    if (mobileHeight === 'half') {
      if (info.offset.y < -60 || info.velocity.y < -220) {
        setMobileHeight('full');
      } else if (info.offset.y > 70 || info.velocity.y > 260) {
        handleClose();
      }
      return;
    }

    if (info.offset.y > 80 || info.velocity.y > 260) {
      setMobileHeight('half');
    }
  };

  const desktopDrawer = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60"
            onClick={handleClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute right-4 top-[85px] bottom-[94px] z-[120] w-[420px] max-w-[calc(100%-2rem)]"
          >
            {content(true)}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (isDesktopViewport) {
    return desktopDrawer;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60"
            onClick={handleClose}
          />

          <motion.div
            drag="y"
            dragListener={false}
            dragControls={mobileDragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.08, bottom: 0.4 }}
            onDragEnd={handleMobileDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: mobileHeight === 'half' ? '50vh' : '88vh' }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-[120] flex rounded-t-[28px]"
          >
            <div className="flex w-full min-h-0 flex-col rounded-t-[28px] bg-[#0f1115]/95 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.45)]">
              <div
                className="flex touch-none justify-center px-3 pb-2 pt-3"
                onPointerDown={(event) => mobileDragControls.start(event)}
              >
                <div className="h-1.5 w-12 rounded-full bg-white/20" />
              </div>
              <div className="min-h-0 flex-1">
                {content(false, (event) => mobileDragControls.start(event))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
