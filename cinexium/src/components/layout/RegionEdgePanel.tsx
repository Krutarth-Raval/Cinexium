'use client';

import { useState, useEffect, useTransition, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const EDGE_PANEL_POSITION_KEY = 'cinexium_region_edge_position';
const HANDLE_HEIGHT = 128;
const TOP_SAFE_ZONE = 80;
const BOTTOM_SAFE_ZONE = 150;
const LONG_PRESS_MS = 260;
const DRAG_CANCEL_DISTANCE = 14;

type EdgeSide = 'left' | 'right';

type EdgePosition = {
  side: EdgeSide;
  top: number;
};

const DEFAULT_EDGE_POSITION: EdgePosition = {
  side: 'right',
  top: 144,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getViewportBounds() {
  const maxTop = Math.max(TOP_SAFE_ZONE, window.innerHeight - BOTTOM_SAFE_ZONE - HANDLE_HEIGHT);
  return {
    minTop: TOP_SAFE_ZONE,
    maxTop,
  };
}

function triggerHapticFeedback() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(18);
  }
}

export const RegionEdgePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState('hollywood');
  const [edgePosition, setEdgePosition] = useState<EdgePosition>(DEFAULT_EDGE_POSITION);
  const [isPointerDragging, setIsPointerDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isSwipeDragging, setIsSwipeDragging] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [loadingText, setLoadingText] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const pointerDragRef = useRef<{
    pointerId: number | null;
    offsetY: number;
  }>({ pointerId: null, offsetY: 0 });
  const pointerStartRef = useRef<{
    x: number;
    y: number;
  } | null>(null);
  const swipeStateRef = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    active: boolean;
  }>({ startX: 0, startY: 0, lastX: 0, active: false });

  const persistEdgePosition = useCallback((position: EdgePosition) => {
    try {
      window.localStorage.setItem(EDGE_PANEL_POSITION_KEY, JSON.stringify(position));
    } catch {}
  }, []);

  const normalizeAndStorePosition = useCallback((position: EdgePosition) => {
    const { minTop, maxTop } = getViewportBounds();
    const nextPosition = {
      side: position.side,
      top: clamp(position.top, minTop, maxTop),
    };

    setEdgePosition(nextPosition);
    persistEdgePosition(nextPosition);
  }, [persistEdgePosition]);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const regionCookie = cookies.find((c) => c.trim().startsWith('cinexium_region='));
    if (regionCookie) {
      setRegion(regionCookie.split('=')[1]);
    }

    try {
      const savedPosition = window.localStorage.getItem(EDGE_PANEL_POSITION_KEY);
      if (savedPosition) {
        const parsed = JSON.parse(savedPosition) as Partial<EdgePosition>;
        if ((parsed.side === 'left' || parsed.side === 'right') && typeof parsed.top === 'number') {
          const { minTop, maxTop } = getViewportBounds();
          setEdgePosition({
            side: parsed.side,
            top: clamp(parsed.top, minTop, maxTop),
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handleResize = () => {
      normalizeAndStorePosition(edgePosition);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [edgePosition, normalizeAndStorePosition]);

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

  const clearLongPress = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const beginPointerDrag = useCallback((clientY: number, pointerId: number) => {
    const currentTop = edgePosition.top;
    pointerDragRef.current = {
      pointerId,
      offsetY: clientY - currentTop,
    };
    setIsPointerDragging(true);
    triggerHapticFeedback();
  }, [edgePosition.top]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    clearLongPress();
    pointerStartRef.current = {
      x: event.clientX,
      y: event.clientY,
    };

    const startPointerDrag = () => beginPointerDrag(event.clientY, event.pointerId);

    if (event.pointerType === 'touch') {
      longPressTimerRef.current = window.setTimeout(startPointerDrag, LONG_PRESS_MS);
      return;
    }

    startPointerDrag();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDragging && event.pointerType === 'touch' && longPressTimerRef.current !== null && pointerStartRef.current) {
      const moveX = event.clientX - pointerStartRef.current.x;
      const moveY = event.clientY - pointerStartRef.current.y;

      if (Math.hypot(moveX, moveY) > DRAG_CANCEL_DISTANCE) {
        clearLongPress();
      }
    }

    if (!isPointerDragging || pointerDragRef.current.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const { minTop, maxTop } = getViewportBounds();
    const nextTop = clamp(event.clientY - pointerDragRef.current.offsetY, minTop, maxTop);
    const nextSide: EdgeSide = event.clientX < window.innerWidth / 2 ? 'left' : 'right';

    setEdgePosition({
      side: nextSide,
      top: nextTop,
    });
  };

  const endPointerDrag = (pointerId: number) => {
    clearLongPress();
    pointerStartRef.current = null;

    if (!isPointerDragging || pointerDragRef.current.pointerId !== pointerId) {
      return;
    }

    normalizeAndStorePosition(edgePosition);
    pointerDragRef.current = { pointerId: null, offsetY: 0 };
    setIsPointerDragging(false);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    endPointerDrag(event.pointerId);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    endPointerDrag(event.pointerId);
  };

  useEffect(() => {
    const isWithinHandleBand = (_x: number, y: number) => {
      const { minTop, maxTop } = getViewportBounds();
      if (y < minTop || y > maxTop + HANDLE_HEIGHT) {
        return false;
      }
      return true;
    };

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      swipeStateRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        active: true,
      };
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const swipeState = swipeStateRef.current;
      if (!swipeState.active || isPointerDragging) return;

      swipeState.lastX = touch.clientX;

      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - swipeState.startY;

      if (Math.abs(deltaY) > Math.abs(deltaX) || Math.abs(deltaY) > 26) {
        return;
      }

      if (!isOpen) {
        if (!isWithinHandleBand(swipeState.startX, swipeState.startY)) {
          return;
        }

        const openingDelta = edgePosition.side === 'right' ? -deltaX : deltaX;
        if (openingDelta > 0) {
          setIsSwipeDragging(true);
          setDragOffset(clamp(openingDelta * 0.55, 0, 32));
        }
        return;
      }

      const closingDelta = edgePosition.side === 'right' ? deltaX : -deltaX;
      if (closingDelta > 0) {
        setIsSwipeDragging(true);
        setDragOffset(clamp(closingDelta * 0.8, 0, 150));
      }
    };

    const handleTouchEnd = () => {
      const swipeState = swipeStateRef.current;
      if (!swipeState.active) return;

      const deltaX = swipeState.lastX - swipeState.startX;

      if (!isOpen) {
        if (isWithinHandleBand(swipeState.startX, swipeState.startY)) {
          const openingDelta = edgePosition.side === 'right' ? -deltaX : deltaX;
          if (openingDelta > 40) {
            setIsOpen(true);
          }
        }
      } else {
        const closingDelta = edgePosition.side === 'right' ? deltaX : -deltaX;
        if (closingDelta > 40) {
          setIsOpen(false);
        }
      }

      swipeStateRef.current = { startX: 0, startY: 0, lastX: 0, active: false };
      setDragOffset(0);
      setIsSwipeDragging(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [edgePosition.side, isOpen, isPointerDragging]);

  const regions = [
    { id: 'hollywood', label: 'ENG', fullLabel: 'HOLLYWOOD' },
    { id: 'bollywood', label: 'HIN', fullLabel: 'BOLLYWOOD' },
    { id: 'anime', label: 'ANI', fullLabel: 'ANIME' },
  ];

  const handleRegionChange = (newRegion: string) => {
    const regionObj = regions.find((r) => r.id === newRegion);
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

  const handlePull = !isOpen ? clamp(dragOffset, 0, 25) : 0;
  const svgW = 11 + handlePull;

  const closedTranslate = 'translateX(0px)';

  const openTranslate = edgePosition.side === 'right'
    ? `translateX(${dragOffset}px)`
    : `translateX(-${dragOffset}px)`;

  const containerStyle = {
    top: edgePosition.top,
    left: edgePosition.side === 'left' ? 0 : 'auto',
    right: edgePosition.side === 'right' ? 0 : 'auto',
    transform: isOpen ? openTranslate : closedTranslate,
  } as const;

  const isLeft = edgePosition.side === 'left';

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 z-[200] bg-[#0f1115] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600 tracking-widest scale-up-center mb-4">
              {loadingText}
            </h1>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes scale-up-center {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .scale-up-center { animation: scale-up-center 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; }
          `,
            }}
          />
        </div>
      )}

      <div
        ref={panelRef}
        className={`xl:hidden fixed z-[100] flex items-center ${isSwipeDragging || isPointerDragging ? '' : 'transition-all duration-300 ease-out'}`}
        style={containerStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="relative focus:outline-none transition-transform active:scale-95"
            aria-label="Open region toggle"
            style={{ width: svgW, height: HANDLE_HEIGHT, touchAction: 'none' }}
          >
            <svg
              width={svgW}
              height={HANDLE_HEIGHT}
              viewBox={`0 0 ${svgW} 128`}
              className={`absolute top-0 overflow-visible drop-shadow-[0_0_12px_rgba(229,9,20,0.5)] ${isLeft ? 'left-0' : 'right-0'}`}
            >
              {isLeft ? (
                <path
                  d={`M 0 0
                      L 0 128
                      L ${svgW - (handlePull + 8)} 128
                      Q ${svgW - handlePull} 128, ${svgW - handlePull} 120
                      L ${svgW - handlePull} 104
                      C ${svgW - handlePull} 84, ${svgW} 84, ${svgW} 64
                      C ${svgW} 44, ${svgW - handlePull} 44, ${svgW - handlePull} 24
                      L ${svgW - handlePull} 8
                      Q ${svgW - handlePull} 0, ${svgW - (handlePull + 8)} 0
                      Z`}
                  className="fill-primary-500 hover:fill-red-500 transition-colors duration-200"
                />
              ) : (
                <path
                  d={`M ${svgW} 0
                      L ${svgW} 128
                      L ${handlePull + 8} 128
                      Q ${handlePull} 128, ${handlePull} 120
                      L ${handlePull} 104
                      C ${handlePull} 84, 0 84, 0 64
                      C 0 44, ${handlePull} 44, ${handlePull} 24
                      L ${handlePull} 8
                      Q ${handlePull} 0, ${handlePull + 8} 0
                      Z`}
                  className="fill-primary-500 hover:fill-red-500 transition-colors duration-200"
                />
              )}
            </svg>
          </button>
        )}

        {isOpen && (
          <div
            className={`bg-[#0f1115]/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300 ease-out flex items-center ${
              isLeft ? 'border-l-0 rounded-r-2xl' : 'border-r-0 rounded-l-2xl'
            }`}
            style={{ touchAction: isPointerDragging ? 'none' : 'pan-x pan-y' }}
          >
            <div className="flex flex-col gap-2 p-2">
              {regions.map((r) => {
                const isActive = region === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleRegionChange(r.id)}
                    className={`flex items-center justify-center rounded-xl px-3 py-2 transition-all duration-300 ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/40 scale-105'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-black tracking-widest">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
