'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AddMemberModal({ 
  isOpen, 
  onClose, 
  groupId,
  onMembersAdded 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  groupId: string;
  onMembersAdded: () => void;
}) {
  const [followers, setFollowers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [heightState, setHeightState] = useState<'half' | 'full'>('half');

  useEffect(() => {
    if (isOpen) {
      setHeightState('half');
      document.body.style.overflow = 'hidden';
      // Fetch user's contacts
      fetch('/api/user/me/contacts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFollowers(data.map((d: any) => d.follower || d));
        })
        .catch(console.error);
    } else {
      document.body.style.overflow = '';
      setSelectedIds(new Set());
      setSearch('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/group/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMember',
          memberId: Array.from(selectedIds)
        })
      });
      if (res.ok) {
        onMembersAdded();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add members');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (e: any, info: any) => {
    if (heightState === 'half') {
      if (info.offset.y < -50 || info.velocity.y < -200) {
        setHeightState('full');
      } else if (info.offset.y > 50 || info.velocity.y > 200) {
        onClose();
      }
    } else {
      if (info.offset.y > 50 || info.velocity.y > 200) {
        setHeightState('half');
      }
    }
  };

  const filteredFollowers = followers.filter(f => 
    (f.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (f.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderContent = () => (
    <div className="flex-1 flex flex-col min-h-0 w-full">
      <div className="px-6 pb-4 shrink-0">
        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-2 px-6 custom-scrollbar">
        {filteredFollowers.map(f => (
          <div 
            key={f.id}
            onClick={() => toggleSelect(f.id)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              selectedIds.has(f.id) ? 'bg-primary-500/10 border-primary-500/50' : 'bg-transparent border-transparent hover:bg-white/5'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
              {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{(f.name || f.username || '?').charAt(0).toUpperCase()}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{f.name}</p>
              <p className="text-gray-500 text-sm truncate">@{f.username}</p>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              selectedIds.has(f.id) ? 'border-primary-500 bg-primary-500' : 'border-gray-600'
            }`}>
              {selectedIds.has(f.id) && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
        ))}
        {filteredFollowers.length === 0 && (
          <p className="text-center text-gray-500 py-8">No contacts found.</p>
        )}
      </div>

      <div className="px-6 pt-2 pb-6 shrink-0 bg-[#0f1115]/95 md:bg-[#1a1d24]">
        <button
          onClick={handleAdd}
          disabled={loading || selectedIds.size === 0}
          className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md"
        >
          {loading ? 'Adding...' : `Add ${selectedIds.size > 0 ? selectedIds.size : ''} Members`}
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={onClose}
          />

          {/* Mobile Bottom Drawer */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ height: '0vh', y: 0 }}
            animate={{ height: heightState === 'half' ? '60vh' : '95vh', y: 0 }}
            exit={{ height: '0vh', y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-[#0f1115]/95 backdrop-blur-xl z-[100] md:hidden rounded-t-[32px] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>
            
            <div className="px-6 pb-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-xl text-white">Add Members</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {renderContent()}
          </motion.div>

          {/* Desktop Centered Modal */}
          <div className="fixed inset-0 z-[100] hidden md:flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1a1d24] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 flex flex-col max-h-[85vh] pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-xl text-white">Add Members</h3>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {renderContent()}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
