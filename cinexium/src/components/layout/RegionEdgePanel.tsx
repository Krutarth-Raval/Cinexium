'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export const RegionEdgePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState('hollywood');
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [loadingText, setLoadingText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const regionCookie = cookies.find((c) => c.trim().startsWith('cinexium_region='));
    if (regionCookie) {
      setRegion(regionCookie.split('=')[1]);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartY = 0;
    let localIsDragging = false;

    const isWithinEdgeHandleBand = () => {
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return false;

      return touchStartY >= rect.top && touchStartY <= rect.bottom;
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].clientX;
      touchEndX = touchStartX;
      touchStartY = e.changedTouches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartX) return;
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;

      // Swipe Left to Open (starting near the right edge)
      if (!isOpen && touchStartX > window.innerWidth - 60 && isWithinEdgeHandleBand()) {
        if (diff > 0) {
          if (!localIsDragging) {
            setIsDragging(true);
            localIsDragging = true;
          }
          // Dampen the drag for a sticky rubber-band feel
          setDragOffset(Math.max(-diff * 0.55, -25));
        }
      }
      
      // Swipe Right to Close
      else if (isOpen) {
        if (diff < 0) {
          if (!localIsDragging) {
            setIsDragging(true);
            localIsDragging = true;
          }
          setDragOffset(Math.min(-diff * 0.8, 150));
        }
      }
    };

    const handleTouchEnd = () => {
      if (!touchStartX || !touchEndX) return;
      const diff = touchStartX - touchEndX;

      // Threshold to trigger state change
      if (!isOpen && touchStartX > window.innerWidth - 60 && isWithinEdgeHandleBand()) {
        if (diff > 40) setIsOpen(true);
      } else if (isOpen) {
        if (diff < -40) setIsOpen(false);
      }
      
      setDragOffset(0);
      setIsDragging(false);
      localIsDragging = false;
      touchStartX = 0;
      touchEndX = 0;
      touchStartY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen]);

  const regions = [
    { id: 'hollywood', label: 'ENG', fullLabel: 'HOLLYWOOD' },
    { id: 'bollywood', label: 'HIN', fullLabel: 'BOLLYWOOD' },
    { id: 'anime', label: 'ANI', fullLabel: 'ANIME' },
  ];

  const handleRegionChange = (newRegion: string) => {
    const regionObj = regions.find(r => r.id === newRegion);
    if (regionObj) {
      setLoadingText(regionObj.fullLabel);
    }

    setRegion(newRegion);
    document.cookie = `cinexium_region=${newRegion}; path=/; max-age=31536000`;

    startTransition(() => {
      router.refresh();
    });

    setTimeout(() => setIsOpen(false), 300);
  };

  if (
    pathname === '/premium/pay' ||
    pathname?.startsWith('/chat') ||
    pathname?.startsWith('/notifications') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/settings') ||
    pathname?.startsWith('/collection')
  ) {
    return null;
  }

  const pull = !isOpen ? Math.max(0, -dragOffset) : 0;
  const svgW = 11 + pull;

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 z-[200] bg-[#0f1115] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-red-800 tracking-widest scale-up-center mb-4">
              {loadingText}
            </h1>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes scale-up-center {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .scale-up-center { animation: scale-up-center 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; }
          `}} />
        </div>
      )}
      <div
        ref={panelRef}
        className={`xl:hidden fixed right-0 top-36 z-[100] flex items-center ${isDragging && isOpen ? '' : 'transition-all duration-300 ease-out'}`}
        style={{ transform: `translateX(${isOpen ? dragOffset : 0}px)` }}
      >
        {/* Edge Handle (Gooey SVG) */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative focus:outline-none transition-transform active:scale-95"
            aria-label="Open region toggle"
            style={{ width: svgW, height: 128 }}
          >
            <svg
              width={svgW}
              height="128"
              viewBox={`0 0 ${svgW} 128`}
              className="absolute right-0 top-0 overflow-visible drop-shadow-[0_0_12px_rgba(229,9,20,0.5)]"
            >
              <path
                d={`M ${svgW} 0 
                    L ${svgW} 128 
                    L ${pull + 8} 128 
                    Q ${pull} 128, ${pull} 120 
                    L ${pull} 104 
                    C ${pull} 84, 0 84, 0 64 
                    C 0 44, ${pull} 44, ${pull} 24 
                    L ${pull} 8 
                    Q ${pull} 0, ${pull + 8} 0 
                    Z`}
                className="fill-primary-500 hover:fill-red-500 transition-colors duration-200"
              />
            </svg>
          </button>
        )}

        {/* Expanded Panel */}
        <div
          className={`bg-[#0f1115]/95 backdrop-blur-xl border border-white/10 border-r-0 rounded-l-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out flex items-center ${isOpen ? 'w-auto opacity-100 p-2' : 'w-0 opacity-0 p-0 border-transparent'
            }`}
        >
          {isOpen && (
            <div className="flex flex-col gap-2">
              {regions.map((r) => {
                const isActive = region === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRegionChange(r.id)}
                    className={`flex items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 ${isActive
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40 scale-105'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <span className="text-xs font-black tracking-widest">{r.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
