'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PremiumUpgradeBanner } from '@/components/ui/PremiumUpgradeBanner';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'group' | 'community';
}

export default function CreateGroupModal({ isOpen, onClose, mode = 'group' }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [followers, setFollowers] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      // Fetch user's contacts
      fetch('/api/user/me/contacts')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setFollowers(data);
        })
        .catch(console.error);
        
      fetch('/api/user/me')
        .then(res => res.json())
        .then(data => {
          if (data.user) setCurrentUser(data.user);
        })
        .catch(console.error);
    } else {
      // Reset state when closed
      setName('');
      setSelectedIds(new Set());
      setAvatarPreview(null);
      setAvatarFile(null);
      setIsPremiumOnly(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isPremiumOnly) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        let changed = false;
        followers.forEach(f => {
          if (!f.follower.isPremium && next.has(f.follower.id)) {
            next.delete(f.follower.id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [isPremiumOnly, followers]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.size === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('memberIds', JSON.stringify(Array.from(selectedIds)));
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      if (mode === 'community') {
        formData.append('isCommunity', 'true');
        formData.append('isPremiumOnly', isPremiumOnly.toString());
      }

      const res = await fetch('/api/chat/group', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const group = await res.json();
        onClose();
        router.push(`/chat/group/${group.id}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create group');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#111318] w-full max-w-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white tracking-wide">{mode === 'community' ? 'Create Community' : 'New Group'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {mode === 'community' && currentUser && !currentUser.isPremium ? (
          <div className="p-6">
             <PremiumUpgradeBanner 
                message="Creating Communities is an exclusive feature for Pro members. Upgrade now to create your own community!"
                onCancel={onClose}
              />
          </div>
        ) : (
          <>
            <div className="px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              
              {/* Avatar and Name Input */}
          <div className="flex gap-4 items-center">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-red-800 flex flex-col items-center justify-center shrink-0 cursor-pointer overflow-hidden group shadow-lg"
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover group-hover:brightness-50 transition-all" />
              ) : (
                <span className="text-white font-bold text-2xl group-hover:opacity-0 transition-opacity">
                  {name ? name.charAt(0).toUpperCase() : '+'}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <div className="flex-1">
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={mode === 'community' ? 'Community Name' : 'Group Name'}
                className="w-full bg-transparent text-white text-lg border-b-2 border-white/10 focus:border-primary-500 py-2 px-1 outline-none transition-colors placeholder:text-gray-600 font-medium"
              />
              </div>
            </div>

            {mode === 'community' && (
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-semibold text-white">Pro-Only Community</h3>
                  <p className="text-xs text-gray-400 mt-1">Only Cinexium Pro users will be able to join</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={isPremiumOnly} onChange={e => setIsPremiumOnly(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 shadow-inner"></div>
                </label>
              </div>
            )}

            {/* Member Selection */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Add Members</h3>
              <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
            </div>
            
            {followers.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-6 text-center border border-white/5">
                <p className="text-gray-400 text-sm">No contacts available to add.</p>
              </div>
            ) : (
              <>
              {isPremiumOnly && followers.some(f => !f.follower.isPremium) && (
                <p className="text-xs text-primary-400 mb-2">Non-Pro contacts have been hidden.</p>
              )}
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                {followers.filter(f => !isPremiumOnly || f.follower.isPremium).map(f => (
                  <label key={f.follower.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent group">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedIds.has(f.follower.id)} 
                      onChange={() => toggleSelect(f.follower.id)} 
                    />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 shrink-0 overflow-hidden shadow-sm">
                        {f.follower.avatar ? <img src={f.follower.avatar} alt={`${f.follower.name}'s avatar`} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-white font-bold">{f.follower.name.charAt(0).toUpperCase()}</div>}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#111318] flex items-center justify-center transition-colors ${selectedIds.has(f.follower.id) ? 'bg-primary-500 text-white' : 'bg-gray-700 text-transparent group-hover:bg-gray-600'}`}>
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-100 text-sm font-medium truncate">{f.follower.name}</p>
                      <p className="text-gray-500 text-xs truncate">@{f.follower.username}</p>
                    </div>
                  </label>
                ))}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#15181e] flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.size === 0 || loading}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:scale-95 shadow-lg shadow-primary-500/20 flex items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              )}
              <span>{loading ? 'Creating...' : 'Create'}</span>
            </button>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
