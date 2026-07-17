'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
  });
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [debouncedUsername] = useDebounce(formData.username, 500);
  const [usernameStatus, setUsernameStatus] = useState<{checking: boolean, available: boolean | null, suggestion?: string}>({ checking: false, available: null });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setFormData({
            name: data.user.name || '',
            username: data.user.username || '',
            bio: data.user.bio || '',
          });
          setAvatarPreview(data.user.avatar || null);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!debouncedUsername || !user) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    if (debouncedUsername.toLowerCase() === user.username.toLowerCase()) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    const checkUsername = async () => {
      setUsernameStatus(prev => ({ ...prev, checking: true }));
      try {
        const res = await fetch(`/api/user/check-username?username=${encodeURIComponent(debouncedUsername)}`);
        const data = await res.json();
        setUsernameStatus({
          checking: false,
          available: data.available,
          suggestion: data.suggestion
        });
      } catch (err) {
        setUsernameStatus({ checking: false, available: null });
      }
    };

    checkUsername();
  }, [debouncedUsername, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (usernameStatus.available === false) {
      setError('Please choose an available username.');
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('username', formData.username);
      data.append('bio', formData.bio);
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const res = await fetch('/api/user/me', {
        method: 'PUT',
        body: data,
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setSuccess('Profile updated successfully!');
        setUser(updatedUser.user);
        setUsernameStatus({ checking: false, available: null });
        router.refresh();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.push(user?.username ? `/profile/${user.username}` : '/')} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5" aria-label="Go back">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="text-xl md:text-3xl font-bold text-white">Edit Profile</h1>
      </div>

      <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center overflow-hidden shadow-lg border-2 border-white/10 group-hover:border-primary-500 transition-colors">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-3xl">{formData.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold text-white mb-1">Profile Picture</h2>
              <p className="text-sm text-gray-400">Click the avatar to upload a new image. Must be under 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Username</label>
              <input 
                type="text" 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                className={`w-full bg-[#0f1115] border rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-2 ${
                  usernameStatus.available === false 
                    ? 'border-red-500 text-red-500 focus:ring-red-500' 
                    : 'border-white/10 text-white focus:border-primary-500'
                }`} 
                required 
              />
              {usernameStatus.available === false && (
                <p className="mt-1 text-xs text-red-500">
                  Already taken. Try:{' '}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, username: usernameStatus.suggestion! }))}
                    className="font-bold underline hover:text-red-400"
                  >
                    {usernameStatus.suggestion}
                  </button>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <input type="email" value={user?.email} disabled className="w-full bg-[#0f1115]/50 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-500">Email cannot be changed currently.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Bio</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors resize-none" placeholder="Tell us about your movie tastes..."></textarea>
          </div>

          {error && <p className="text-primary-500 text-sm font-medium">{error}</p>}
          {success && <p className="text-green-500 text-sm font-medium">{success}</p>}

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button type="submit" disabled={saving} className="bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-medium py-2.5 px-8 rounded-xl transition-all shadow-[0_0_15px_rgba(229,9,20,0.3)]">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
