'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { PrivacyToggle } from '@/components/profile/PrivacyToggle';
import { SettingsPageBoneyard } from '@/components/skeleton/Boneyard';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { getThemeDefinition, THEME_DEFINITIONS, type ThemeDefinition } from '@/lib/themes';

type AccountUser = {
  role?: string | null;
  email: string;
  isPremium: boolean;
  isPrivate: boolean;
  premiumType?: string | null;
  premiumUntil?: string | null;
  themePreference?: string | null;
};

export default function AccountSettingsPage() {
  const router = useRouter();
  
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Deletion states
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isThemeSelectionOpen, setIsThemeSelectionOpen] = useState(false);
  const [themeToConfirm, setThemeToConfirm] = useState<ThemeDefinition | null>(null);
  const [isMobileThemeDrawer, setIsMobileThemeDrawer] = useState(false);
  const [themeDrawerHeight, setThemeDrawerHeight] = useState<'half' | 'full'>('half');

  const getActiveThemeId = () => {
    if (!user) return 'default';
    if (user.isPremium && (!user.themePreference || user.themePreference === 'default')) {
      return 'neon-purple';
    }
    return user.themePreference || 'default';
  };
  const activeTheme = getThemeDefinition(getActiveThemeId());
  const visibleThemes = user?.isPremium
    ? THEME_DEFINITIONS.filter((theme) => theme.id !== 'default')
    : THEME_DEFINITIONS.filter((theme) => !theme.premiumOnly);

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

  useEffect(() => {
    const checkMobile = () => setIsMobileThemeDrawer(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isThemeSelectionOpen) {
      document.body.style.overflow = 'hidden';
      setThemeDrawerHeight('half');
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isThemeSelectionOpen]);

  const handleThemeDrawerDragEnd = (_e: any, info: any) => {
    if (themeDrawerHeight === 'half') {
      if (info.offset.y < -50 || info.velocity.y < -200) {
        setThemeDrawerHeight('full');
      } else if (info.offset.y > 50 || info.velocity.y > 200) {
        setIsThemeSelectionOpen(false);
      }
    } else if (info.offset.y > 50 || info.velocity.y > 200) {
      setThemeDrawerHeight('half');
    }
  };

  const requestDeleteOtp = async () => {
    setDeleteError('');
    setIsSendingDeleteOtp(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'PUT',
      });

      if (res.ok) {
        setOtpSent(true);
        setDeleteError('');
      } else {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || 'Failed to send OTP.');
      }
    } catch {
      setDeleteError('Error sending OTP.');
    } finally {
      setIsSendingDeleteOtp(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteError('');
    setIsConfirmingDelete(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: deleteOtp })
      });

      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json().catch(() => null);
        setDeleteError(data?.error || 'Invalid OTP');
      }
    } catch {
      setDeleteError('Error deleting account');
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  if (loading) {
    return <SettingsPageBoneyard />;
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
            <Link href="/settings/activities/liked-content" className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Liked Content</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
            <Link href="/settings/activities/your-comments" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
              <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Your Comments</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Premium Upgrade Banner */}
        <section className="animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Your Subscription</h2>
          <Link href="/premium" className="block relative bg-gradient-to-r from-purple-600/20 to-fuchsia-600/20 hover:from-purple-600/30 hover:to-fuchsia-600/30 border border-purple-500/30 rounded-2xl p-6 transition-all group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-[30px] rounded-full" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  {user?.isPremium ? 'Cinexium Pro' : 'Upgrade to PRO'}
                  <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(168,85,247,0.4)]">Premium</span>
                </h3>
                <p className="text-gray-400 text-sm">
                  {user?.isPremium ? `Active - ${user.premiumType ? user.premiumType.charAt(0).toUpperCase() + user.premiumType.slice(1) : 'Monthly'} Plan` : 'Unlock unlimited collections, custom badges, and exclusive features.'}
                </p>
              </div>
              <svg className="w-5 h-5 text-purple-400 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </section>

        <section className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Your Account</h2>
          <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden flex flex-col">
            
            {/* Privacy Toggle inline */}
            {user && (
              <>
                <div 
                  className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => setIsThemeSelectionOpen(true)}
                >
                  <span className="text-white font-medium group-hover:text-primary-400 transition-colors">Theme Preference</span>
                  <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                      {activeTheme.name}
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeTheme.primary500 }} />
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <span className="text-white font-medium">Account Privacy</span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <PrivacyToggle initialIsPrivate={user.isPrivate} />
                  </div>
                </div>
              </>
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
                      <button
                        onClick={requestDeleteOtp}
                        disabled={isSendingDeleteOtp}
                        className="px-6 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm shadow-[0_0_10px_rgba(229,9,20,0.3)] disabled:opacity-70 disabled:cursor-wait"
                      >
                        {isSendingDeleteOtp ? 'Sending...' : 'Send OTP'}
                      </button>
                      <button onClick={() => setIsDeleting(false)} className="px-6 py-2 text-gray-400 hover:text-white font-medium text-sm">Cancel</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <input type="text" value={deleteOtp} onChange={e => setDeleteOtp(e.target.value)} placeholder="Enter 6-digit OTP" className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary-500 tracking-widest text-center text-lg font-mono" maxLength={6} />
                      <div className="flex gap-4">
                        <button
                          onClick={confirmDelete}
                          disabled={isConfirmingDelete || deleteOtp.trim().length !== 6}
                          className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {isConfirmingDelete ? 'Deleting...' : 'Confirm Deletion'}
                        </button>
                        <button onClick={() => { setIsDeleting(false); setOtpSent(false); setDeleteOtp(''); }} className="px-6 py-3 bg-[#252a34] text-white rounded-xl font-medium">Cancel</button>
                      </div>
                    </div>
                  )}
                  {deleteError && <p className="text-primary-500 text-sm font-medium">{deleteError}</p>}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* About & Legal Section */}
        {user?.role === 'admin' && (
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Admin Tools</h2>
            <div className="bg-[#1a1d24] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
              <Link href="/settings/admin-tools/subscriptions" className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                <span className="text-white font-medium group-hover:text-primary-400 transition-colors">User Subscriptions</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500 group-hover:text-primary-500 transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        )}

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

        {/* Powered by TMDB (Mobile Only) */}
        <div className="flex md:hidden items-center justify-center gap-2 pt-4 pb-2 text-gray-500 text-sm">
          <span>Powered by</span>
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-bold text-primary-500">
            TMDB
          </a>
        </div>

      </div>

      {/* Theme Selection Drawer */}
      <AnimatePresence>
        {isThemeSelectionOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsThemeSelectionOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {isMobileThemeDrawer ? (
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.1, bottom: 0.5 }}
                onDragEnd={handleThemeDrawerDragEnd}
                initial={{ height: '0vh', y: 0 }}
                animate={{ height: themeDrawerHeight === 'half' ? '58vh' : '92vh', y: 0 }}
                exit={{ height: '0vh', y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col rounded-t-[32px] border-t border-white/10 bg-[#0f1115]/95 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:hidden"
              >
                <div className="flex w-full justify-center py-4 shrink-0 cursor-grab active:cursor-grabbing">
                  <div className="h-1.5 w-12 rounded-full bg-white/20" />
                </div>

                <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5 shrink-0">
                  <h2 className="text-xl font-bold text-white">Select Theme</h2>
                  <button onClick={() => setIsThemeSelectionOpen(false)} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {visibleThemes.map(theme => {
                    const isLocked = !user?.isPremium && theme.id !== 'default';
                    const isSelected = getActiveThemeId() === theme.id;
                    
                    return (
                      <div 
                        key={theme.id}
                        onClick={() => {
                          if (isLocked) {
                            setIsThemeSelectionOpen(false);
                            router.push('/premium');
                            return;
                          }
                          if (!isSelected) {
                            setThemeToConfirm(theme);
                          }
                        }}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-colors cursor-pointer ${isSelected ? 'border-primary-500 bg-primary-500/10' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: theme.primary500 }}>
                            {isSelected && <svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{theme.name}</span>
                        </div>
                        {isLocked && (
                          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-4 bottom-4 right-4 z-[60] hidden w-[420px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0f1115]/95 shadow-2xl backdrop-blur-xl lg:flex"
              >
                <div className="flex items-center justify-between border-b border-white/5 bg-[#1a1d24]/50 px-6 py-5 shrink-0">
                  <h2 className="text-xl font-bold text-white">Select Theme</h2>
                  <button onClick={() => setIsThemeSelectionOpen(false)} className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
                  {visibleThemes.map(theme => {
                    const isLocked = !user?.isPremium && theme.id !== 'default';
                    const isSelected = getActiveThemeId() === theme.id;
                    
                    return (
                      <div 
                        key={theme.id}
                        onClick={() => {
                          if (isLocked) {
                            setIsThemeSelectionOpen(false);
                            router.push('/premium');
                            return;
                          }
                          if (!isSelected) {
                            setThemeToConfirm(theme);
                          }
                        }}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-colors cursor-pointer ${isSelected ? 'border-primary-500 bg-primary-500/10' : 'border-white/5 hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full shadow-lg" style={{ backgroundColor: theme.primary500 }}>
                            {isSelected && <svg className="w-5 h-5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{theme.name}</span>
                        </div>
                        {isLocked && (
                          <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      {themeToConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1d24] rounded-3xl border border-white/10 w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 text-center">
             <div className="w-16 h-16 rounded-full shadow-lg mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: themeToConfirm.primary500 }}>
                <svg className="w-8 h-8 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Change Theme</h3>
             <p className="text-gray-400 text-sm mb-8">Are you sure you want to change your theme to <strong>{themeToConfirm.name}</strong>?</p>
             <div className="flex gap-4">
                <button onClick={() => setThemeToConfirm(null)} className="flex-1 py-3 bg-[#252a34] text-white rounded-xl font-medium hover:bg-[#2c323f]">Cancel</button>
                <button onClick={async () => {
                  const newTheme = themeToConfirm.id;
                  setThemeToConfirm(null);
                  setIsThemeSelectionOpen(false);
                  
                  // Optimistic update
                  setUser((currentUser) =>
                    currentUser ? { ...currentUser, themePreference: newTheme } : currentUser
                  );
                  window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }));

                  // Save to API
                  try {
                    await fetch('/api/user/theme', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ themePreference: newTheme })
                    });
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="flex-1 py-3 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:brightness-110"
                style={{ backgroundColor: themeToConfirm.primary500 }}
              >
                Yes, Change
              </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
