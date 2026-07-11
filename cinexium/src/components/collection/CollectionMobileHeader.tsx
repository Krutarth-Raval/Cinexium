'use client';

import React, { useState, useEffect } from 'react';

export const CollectionMobileHeader = ({
  thumbnail,
  name,
}: {
  thumbnail: string | null;
  name: string;
}) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shrink from 160px to 80px over 120px of scroll
  const size = Math.max(80, 160 - scrollY * 0.67);
  const borderRadius = Math.max(16, 24 - scrollY * 0.05);

  return (
    <div className="flex flex-col items-center md:hidden">
      <div
        className="rounded-2xl overflow-hidden bg-[#1a1d24] border border-white/10 flex-shrink-0 shadow-2xl transition-[width,height] duration-100 ease-out"
        style={{ width: size, height: size, borderRadius }}
      >
        {thumbnail ? (
          <img src={thumbnail} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#252a34] to-[#1a1d24]">
            <svg className="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 6.878V6a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 18 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 0 0 4.5 9v.878m13.5-3A2.25 2.25 0 0 1 19.5 9v.878m0 0a2.246 2.246 0 0 0-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0 1 21 12v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
