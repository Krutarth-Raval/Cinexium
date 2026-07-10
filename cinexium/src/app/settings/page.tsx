'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { PrivacyToggle } from '@/components/profile/PrivacyToggle';

export default function SettingsPage() {
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

  // Deletion states
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

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
        setSuccess('Profile updated successfully!');
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

  const requestDeleteOtp = async () => {
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, action: 'login' }) // Reuse OTP generation logic
      });
      if (res.ok) {
        setOtpSent(true);
      } else {
        setDeleteError('Failed to send OTP.');
      }
    } catch {
      setDeleteError('Error sending OTP.');
    }
  };

  const confirmDelete = async () => {
    setDeleteError('');
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: deleteOtp })
      });
      if (res.ok) {
        signOut({ callbackUrl: '/' });
      } else {
        setDeleteError('Invalid OTP');
      }
    } catch {
      setDeleteError('Error deleting account');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
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
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary-500 transition-colors" required />
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

      {/* Privacy Settings */}
      {user && (
        <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Account Privacy</h2>
            <p className="text-sm text-gray-400">When private, only approved followers can see your profile and collection.</p>
          </div>
          <PrivacyToggle initialIsPrivate={user.isPrivate} />
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl border border-primary-500/20">
        <h2 className="text-xl font-bold text-primary-500 mb-6">Danger Zone</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <h3 className="text-white font-medium">Log out from all devices</h3>
              <p className="text-gray-400 text-sm">You will need to sign in again to access your account.</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="px-6 py-2 bg-[#252a34] hover:bg-[#323844] text-white rounded-xl transition-colors font-medium border border-white/10 whitespace-nowrap">
              Log Out
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-white font-medium">Delete Account</h3>
                <p className="text-gray-400 text-sm">Permanently delete your account and all associated data.</p>
              </div>
              {!isDeleting && (
                <button onClick={() => setIsDeleting(true)} className="px-6 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 rounded-xl transition-colors font-bold border border-primary-500/50 whitespace-nowrap">
                  Delete Account
                </button>
              )}
            </div>

            {isDeleting && (
              <div className="mt-4 p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl space-y-4">
                <p className="text-sm text-gray-300">To confirm deletion, we will send an OTP to your email. This action <span className="font-bold text-primary-500">cannot be undone</span>.</p>
                
                {!otpSent ? (
                  <div className="flex gap-4">
                    <button onClick={requestDeleteOtp} className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm shadow-[0_0_10px_rgba(229,9,20,0.3)]">Send OTP</button>
                    <button onClick={() => setIsDeleting(false)} className="px-6 py-2 text-gray-400 hover:text-white font-medium text-sm">Cancel</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input type="text" value={deleteOtp} onChange={e => setDeleteOtp(e.target.value)} placeholder="Enter 6-digit OTP" className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 tracking-widest text-center text-lg font-mono" maxLength={6} />
                    <div className="flex gap-4">
                      <button onClick={confirmDelete} className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold">Confirm Deletion</button>
                      <button onClick={() => { setIsDeleting(false); setOtpSent(false); setDeleteOtp(''); }} className="px-6 py-3 bg-[#252a34] text-white rounded-xl font-medium">Cancel</button>
                    </div>
                  </div>
                )}
                {deleteError && <p className="text-primary-500 text-sm font-medium">{deleteError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
