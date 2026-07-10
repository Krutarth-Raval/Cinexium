'use client';

import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    if (isOpen) {
      // Fetch user's contacts
      fetch('/api/user/me/contacts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFollowers(data);
        })
        .catch(console.error);
    } else {
      setSelectedIds(new Set());
      setSearch('');
    }
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

  if (!isOpen) return null;

  const filteredFollowers = followers.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#1a1d24] rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/10 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Add Members</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <input
          type="text"
          placeholder="Search contacts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#111318] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 mb-4 transition-colors"
        />

        <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-2 pr-2 custom-scrollbar">
          {filteredFollowers.map(f => (
            <div 
              key={f.id}
              onClick={() => toggleSelect(f.id)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                selectedIds.has(f.id) ? 'bg-primary-500/10 border-primary-500/50' : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden shrink-0">
                {f.avatar ? <img src={f.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{f.name.charAt(0).toUpperCase()}</div>}
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
}
