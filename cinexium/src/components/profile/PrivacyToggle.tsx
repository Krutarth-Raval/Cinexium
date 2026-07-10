'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const PrivacyToggle = ({ 
  initialIsPrivate 
}: { 
  initialIsPrivate: boolean
}) => {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePrivacy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/privacy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: !isPrivate }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsPrivate(data.isPrivate);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={togglePrivacy}
      disabled={loading}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors border flex items-center gap-2 ${
        isPrivate 
          ? 'bg-gray-800 text-white border-gray-600 hover:bg-gray-700' 
          : 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20'
      }`}
      title={isPrivate ? "Switch to Public" : "Switch to Private"}
    >
      {isPrivate ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Private
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
          Public
        </>
      )}
    </button>
  );
};
