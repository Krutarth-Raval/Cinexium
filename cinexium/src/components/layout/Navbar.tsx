'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { NotificationBell } from './NotificationBell';
import { RegionEdgePanel } from './RegionEdgePanel';
import { useSocket } from '../providers/SocketProvider';
import { Logo } from '../ui/Logo';

export const Navbar = () => {
  const { data: session } = useSession();
  const { hasUnreadMessages } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [region, setRegion] = useState('hollywood');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [isPending, startTransition] = useTransition();
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    if (session) {
      fetch('/api/user/me')
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to fetch user: ${res.status} ${text}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.user) {
            setUserData(data.user);
            
            const applyTheme = (themePref: string, isPrem: boolean) => {
              let themeToApply = 'theme-default';
              if (isPrem) {
                if (!themePref || themePref === 'default') {
                  themeToApply = 'theme-neon-purple';
                } else {
                  themeToApply = `theme-${themePref}`;
                }
              }
              document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
              if (themeToApply !== 'theme-default') {
                document.body.classList.add(themeToApply);
              }
            };
            
            applyTheme(data.user.themePreference, data.user.isPremium);

            const handleThemeChange = (e: Event) => {
              const customEvent = e as CustomEvent;
              applyTheme(customEvent.detail, data.user.isPremium);
            };

            window.addEventListener('themeChanged', handleThemeChange);
            return () => window.removeEventListener('themeChanged', handleThemeChange);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const regionCookie = cookies.find((c) => c.trim().startsWith('cinexium_region='));
    if (regionCookie) {
      setRegion(regionCookie.split('=')[1]);
    }
  }, []);

  const regions = [
    { id: 'hollywood', label: 'Hollywood', desktopLabel: 'HOLLYWOOD', mobileLabel: 'ENG' },
    { id: 'bollywood', label: 'Bollywood', desktopLabel: 'BOLLYWOOD', mobileLabel: 'HIN' },
    { id: 'anime', label: 'Anime', desktopLabel: 'ANIME', mobileLabel: 'ANI' },
  ];

  const handleRegionChange = (newRegion: string) => {
    const regionObj = regions.find(r => r.id === newRegion);
    if (regionObj) {
      setLoadingText(regionObj.label.toUpperCase());
    }

    setRegion(newRegion);
    document.cookie = `cinexium_region=${newRegion}; path=/; max-age=31536000`;
    setDropdownOpen(false);

    startTransition(() => {
      router.refresh();
    });
  };

  const pathSegments = pathname?.split('/').filter(Boolean) || [];
  if ((pathSegments[0] === 'movie' || pathSegments[0] === 'series') && pathSegments.length > 1) {
    return null;
  }

  if (
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/verify-otp' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname === '/guidelines' ||
    pathname === '/contact'
  ) {
    return null;
  }

  const renderAuthSection = (isMobile = false) => {
    if (session) {
      // User is logged in - show profile circle
      const name = userData?.name || session.user?.name || '';
      const email = userData?.email || session.user?.email || '';
      const initial = name.charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || 'U';
      const avatarUrl = userData?.avatar;

      return (
        <Link href="/profile" className={`flex items-center justify-center ${avatarUrl ? 'bg-[#1a1d24]' : 'bg-gradient-to-br from-primary-500 to-red-800'} text-white font-bold rounded-full transition-transform hover:scale-105 overflow-hidden border border-white/20 ${isMobile ? 'w-12 h-12 text-base' : 'w-12 h-12 text-lg'}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover bg-white/5" />
          ) : (
            initial
          )}
        </Link>
      );
    }

    // User is logged out - show login/signup
    return (
      <>
        <Link href="/login" className={`text-white hover:text-primary-500 font-medium transition-colors ${isMobile ? 'text-[11px]' : 'text-sm'}`}>
          Log in
        </Link>
        <Link href="/register" className={`bg-primary-500 hover:bg-primary-600 text-white rounded-full font-medium transition-colors whitespace-nowrap ${isMobile ? 'px-3.5 py-1.5 text-[11px]' : 'px-5 py-2 text-sm'}`}>
          Sign up
        </Link>
      </>
    );
  };

  return (
    <>
      {isPending && (
        <div className="fixed inset-0 z-[200] bg-[#0f1115] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-red-800 tracking-widest scale-up-center mb-4">
              {loadingText}
            </h1>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes scale-up-center {
              0% { transform: scale(0.9); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
            .scale-up-center { animation: scale-up-center 0.6s cubic-bezier(0.390, 0.575, 0.565, 1.000) both; }
          `}} />
        </div>
      )}
      <div className={(pathname?.startsWith('/chat') || pathname?.startsWith('/notifications') || pathname?.startsWith('/profile') || pathname?.startsWith('/settings') || pathname?.startsWith('/collection') || pathname?.startsWith('/search')) ? 'hidden md:block' : ''}>
        <nav className={`fixed z-50 transition-all duration-500 ease-in-out inset-x-0 mx-auto ${scrolled
          ? 'top-0 w-full max-w-full bg-[#0f1115]/90 backdrop-blur-xl border-b border-white/10 rounded-none'
          : 'top-4 w-[calc(100%-2rem)] max-w-7xl bg-[#0f1115]/60 backdrop-blur-lg border border-white/10 rounded-[32px]'
          }`}>
          <div className="max-w-7xl mx-auto pl-4 pr-2 md:pl-6 md:pr-2 lg:pl-8 lg:pr-2 relative z-50">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <Logo className="h-8 md:h-10 w-auto transition-all" />
              </Link>
              <div className="hidden md:block">
                <div className="ml-4 lg:ml-8 flex items-baseline space-x-1 lg:space-x-2">
                  {[
                    { name: 'Home', href: '/' },
                    { name: 'Movies', href: '/movies' },
                    { name: 'Series', href: '/series' },
                    { name: 'Search', href: '/search' },
                    { name: 'Chat', href: '/chat' },
                  ].map((link) => {
                    const isActive = pathname === link.href || (link.href === '/chat' && pathname.startsWith('/chat')) || (link.href === '/notifications' && pathname.startsWith('/notifications'));
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-primary-500 shadow-md shadow-primary-500/30 rounded-full"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                        <span className="relative z-10">{link.name}</span>
                        {link.name === 'Chat' && hasUnreadMessages && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full z-20 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {(!userData || !userData.isPremium) && (
                <Link href="/premium" className="hidden lg:flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.4)] hover:shadow-[0_0_15px_rgba(168,85,247,0.6)] transition-all hover:scale-105 mr-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  PRO
                </Link>
              )}

              {/* Desktop Region Selector */}
              <div className="hidden xl:flex items-center space-x-1 bg-white/5 rounded-full p-1 border border-white/10">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleRegionChange(r.id)}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-300 ${
                      region === r.id
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {r.desktopLabel}
                  </button>
                ))}
              </div>

              {session && <NotificationBell />}

              {/* Auth Buttons / Profile Circle */}
              {renderAuthSection(false)}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-3">
              {session && <NotificationBell isMobile={true} />}

              {/* Mobile Auth Buttons / Profile Circle */}
              {renderAuthSection(true)}
            </div>
          </div>
        </div>
      </nav>
      </div>
      <RegionEdgePanel />
    </>
  );
};;
