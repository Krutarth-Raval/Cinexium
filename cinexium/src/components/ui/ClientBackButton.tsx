'use client';

import { useRouter } from 'next/navigation';

export const ClientBackButton = ({ className }: { className?: string }) => {
  const router = useRouter();
  
  return (
    <button 
      onClick={() => router.back()} 
      className={className || "p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5"} 
      aria-label="Go back"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  );
};
