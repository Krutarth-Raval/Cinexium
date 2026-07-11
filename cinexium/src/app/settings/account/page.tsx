'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { PrivacyToggle } from '@/components/profile/PrivacyToggle';
import { ClientBackButton } from '@/components/ui/ClientBackButton';

export default function AccountSettingsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  const requestDeleteOtp = async () => {
    setDeleteError('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, action: 'login' }) 
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
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Settings</h1>
      </div>

      <div className="space-y-8">

        {/* Notifications Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Notifications</h2>
          <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
            <Link href="/settings/notifications" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Notification Preferences</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Your Activity Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Your Activity</h2>
          <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden flex flex-col">
            <Link href="/settings/activities/liked-collections" className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Liked Collections</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link href="/settings/activities/liked-media" className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Liked Media (Movies & Series)</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link href="/settings/activities/liked-comments" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Liked Comments</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Your Account Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Your Account</h2>
          <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden flex flex-col">
            
            {/* Privacy Toggle inline */}
            {user && (
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <span className="text-white font-medium">Account Privacy</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <PrivacyToggle initialIsPrivate={user.isPrivate} />
                </div>
              </div>
            )}

            <Link href="/settings/blocked" className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Blocked Users</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors text-left group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Log Out</span>
            </button>

            <div className="p-4 flex flex-col gap-4">
              <div 
                className="flex items-center justify-between cursor-pointer group"
                onClick={() => setIsDeleting(!isDeleting)}
              >
                <span className="text-primary-500 font-bold group-hover:text-primary-400 transition-colors">Delete Account</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 text-primary-500 transition-transform ${isDeleting ? 'rotate-90' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>

              {isDeleting && (
                <div className="mt-2 p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl space-y-4">
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

        {/* About & Legal Section */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">About & Legal</h2>
          <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
            <Link href="/settings/about" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">About & Legal Information</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
