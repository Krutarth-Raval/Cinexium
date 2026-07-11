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

  if (pathname?.startsWith('/chat') || pathname?.startsWith('/notifications') || pathname?.startsWith('/profile') || pathname?.startsWith('/settings') || pathname?.startsWith('/collection')) {
    return null;
  }

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
        className={`md:hidden fixed right-0 top-36 z-[100] flex items-center transition-all duration-300 ease-out`}
      >
        {/* Edge Handle */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-2 h-32 bg-primary-500 rounded-l-md shadow-[0_0_15px_rgba(229,9,20,0.5)] hover:w-3 transition-all duration-200"
            aria-label="Open region toggle"
          />
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
