'use client';

import type { GifSelection } from '@/lib/giphy';

interface SelectedGifPreviewProps {
  gif: GifSelection;
  onClear: () => void;
  className?: string;
}

export function SelectedGifPreview({
  gif,
  onClear,
  className = '',
}: SelectedGifPreviewProps) {
  return (
    <div className={`relative inline-block w-fit max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#1a1d24] ${className}`}>
      <img
        src={gif.url}
        alt="Selected GIF"
        className="block h-auto w-auto max-h-40 max-w-full object-contain"
      />
      <button
        type="button"
        onClick={onClear}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
        aria-label="Remove selected GIF"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
        GIF
      </div>
    </div>
  );
}
