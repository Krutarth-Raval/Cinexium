'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export const DisclaimerBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const hiddenUntil = localStorage.getItem('hideDisclaimerUntil');
    if (!hiddenUntil || Date.now() > parseInt(hiddenUntil, 10)) {
      setIsVisible(true);
    }
  }, []);

  if (pathname === '/premium/pay') {
    return null;
  }

  if (!isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    // Hide for 24 hours
    localStorage.setItem('hideDisclaimerUntil', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  return (
    <div className="w-full pt-4 pb-[calc(1rem+4rem+env(safe-area-inset-bottom))] md:pb-4 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0f1115] text-gray-400 text-xs sm:text-sm flex items-center justify-between gap-4 z-40 relative">
      <div className="flex-1 text-center sm:text-left">
        <p>
          <strong>Notice:</strong> We do not host any videos. Everything comes from third-party sources.
        </p>
      </div>
      <button 
        onClick={handleDismiss}
        className="p-1 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss notice"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
