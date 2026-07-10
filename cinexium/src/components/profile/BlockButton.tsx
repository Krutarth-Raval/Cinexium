'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ui/ConfirmModal';

export function BlockButton({ username, initiallyBlocked }: { username: string, initiallyBlocked: boolean }) {
  const [isBlocked, setIsBlocked] = useState(initiallyBlocked);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();

  const performBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/block`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsBlocked(data.blocked);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!isBlocked) {
      setIsConfirmOpen(true);
      return;
    }
    performBlock();
  };

  return (
    <>
    <button 
      onClick={handleBlock} 
      disabled={loading}
      className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
        isBlocked 
          ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20' 
          : 'bg-[#252a34] text-red-400 border-white/10 hover:bg-[#323844]'
      }`}
    >
      {isBlocked ? 'Unblock' : 'Block'}
    </button>
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          performBlock();
        }}
        title="Block User"
        message={`Are you sure you want to block ${username}?`}
        confirmText="Block"
        isDestructive={true}
      />
    </>
  );
}
