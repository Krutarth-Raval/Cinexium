'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UsernameDisplay } from '@/components/profile/UsernameDisplay';

export default function ShareProfileModal({ 
  isOpen, 
  onClose, 
  profileId,
  profileUsername,
  profileName,
  profileAvatar,
  isPremium = false,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  profileId: string;
  profileUsername: string;
  profileName: string;
  profileAvatar?: string;
  isPremium?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setCopied(false);
      setTilt({ rotateX: 0, rotateY: 0 });
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const profileLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://cinexium.site'}/profile/${profileUsername}`;
  const shareText = `Check out @${profileUsername} on Cinexium`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName} on Cinexium`,
          text: shareText,
          url: profileLink,
        });
      } catch {
        // Ignore cancelled native share
      }
      return;
    }

    handleCopyLink();
  };

  const openExternalShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const rotateY = ((x / bounds.width) - 0.5) * 12;
    const rotateX = ((0.5 - y / bounds.height)) * 12;
    setTilt({ rotateX, rotateY });
  };

  const handleCardLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const shareApps = [
    {
      key: 'share',
      label: 'Share',
      onClick: handleNativeShare,
      title: 'Share',
      iconBoxClassName: 'bg-primary-500/15 text-primary-400',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      ),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      onClick: () => openExternalShare(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileLink}`)}`),
      title: 'WhatsApp',
      iconBoxClassName: 'bg-emerald-500/15 text-emerald-400',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19.05 4.94A9.86 9.86 0 0 0 12.03 2C6.53 2 2.06 6.47 2.06 11.98c0 1.76.46 3.47 1.33 4.98L2 22l5.2-1.36a9.94 9.94 0 0 0 4.82 1.23h.01c5.5 0 9.97-4.47 9.97-9.98a9.9 9.9 0 0 0-2.95-6.95Zm-7.02 15.24h-.01a8.25 8.25 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.25 8.25 0 0 1-1.27-4.38c0-4.56 3.7-8.27 8.25-8.27 2.2 0 4.27.86 5.83 2.43a8.2 8.2 0 0 1 2.42 5.84c0 4.56-3.7 8.27-8.26 8.27Zm4.54-6.2c-.25-.12-1.48-.73-1.71-.81-.23-.09-.4-.12-.57.12-.16.24-.65.8-.8.97-.15.18-.3.2-.56.07a6.7 6.7 0 0 1-1.97-1.22 7.42 7.42 0 0 1-1.37-1.71c-.15-.25-.02-.39.11-.51.12-.12.25-.3.37-.45.12-.15.16-.25.24-.42.08-.16.04-.3-.02-.42-.06-.12-.56-1.35-.76-1.85-.2-.47-.41-.4-.57-.4h-.48c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.68 2.56 4.07 3.59.57.25 1.01.4 1.36.5.57.18 1.1.15 1.51.09.46-.07 1.48-.6 1.69-1.19.21-.58.21-1.08.15-1.18-.06-.1-.22-.15-.46-.27Z" />
        </svg>
      ),
    },
    {
      key: 'telegram',
      label: 'Telegram',
      onClick: () => openExternalShare(`https://t.me/share/url?url=${encodeURIComponent(profileLink)}&text=${encodeURIComponent(shareText)}`),
      title: 'Telegram',
      iconBoxClassName: 'bg-sky-500/15 text-sky-400',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.94 4.62c.18-.82-.63-1.5-1.39-1.16L3.33 10.4c-.8.33-.76 1.48.07 1.74l4.35 1.36 1.67 5.15c.24.75 1.2.9 1.66.26l2.42-3.3 4.75 3.5c.58.43 1.42.12 1.58-.58l2.11-13.9ZM9.07 12.96l8.74-5.52-6.81 6.87a.75.75 0 0 0-.2.37l-.63 2.96-1.1-3.39Zm1.43 4.04.33-1.52 1.51 1.12-1.84.4Z" />
        </svg>
      ),
    },
    {
      key: 'x',
      label: 'X',
      onClick: () => openExternalShare(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${profileLink}`)}`),
      title: 'X',
      iconBoxClassName: 'bg-white/10 text-white',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.26l-4.9-7.42L5.54 22H2.43l7.24-8.27L1.6 2h6.42l4.43 6.72L18.9 2Zm-1.1 18h1.72L7.07 3.9H5.22L17.8 20Z" />
        </svg>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      onClick: () => openExternalShare(`mailto:?subject=${encodeURIComponent(`${profileName} on Cinexium`)}&body=${encodeURIComponent(`${shareText}\n\n${profileLink}`)}`),
      title: 'Email',
      iconBoxClassName: 'bg-amber-500/15 text-amber-400',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8m-18 8h18V8H3v8z" />
        </svg>
      ),
    },
    {
      key: 'copy',
      label: copied ? 'Copied' : 'Copy Link',
      onClick: handleCopyLink,
      title: copied ? 'Copied' : 'Copy Link',
      iconBoxClassName: copied ? 'bg-green-500/15 text-green-400' : 'bg-white/10 text-white',
      icon: copied ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
  ];

  if (!isOpen) return null;

  const renderHeader = () => (
    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
      <h3 className="text-xl font-bold text-white">{`Share @${profileUsername}`}</h3>
      <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );

  const renderContent = () => (
    <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
      <div className="flex min-h-full flex-col gap-6">
        <div className="perspective-[1600px]">
          <motion.div
            onMouseMove={handleCardMove}
            onMouseLeave={handleCardLeave}
            animate={{
              rotateX: tilt.rotateX,
              rotateY: tilt.rotateY,
            }}
            transition={{ type: 'spring', stiffness: 180, damping: 18 }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative aspect-[3/4] w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#141821] shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:aspect-[3/4]"
          >
            {profileAvatar ? (
              <img src={profileAvatar} alt={profileName} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(20,255,190,0.25),_transparent_45%),linear-gradient(180deg,#1c2330_0%,#0f1115_100%)]" />
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80" />
            <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-[32px] bg-[linear-gradient(180deg,rgba(15,17,21,0)_0%,rgba(15,17,21,0.35)_32%,rgba(15,17,21,0.92)_100%)] backdrop-blur-xl sm:h-28" />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(130deg, rgba(255,255,255,0.22), transparent 28%, transparent 72%, rgba(255,255,255,0.08))',
                transform: 'translateZ(40px)',
              }}
            />

            <div className="absolute inset-x-0 bottom-0 px-6 pb-4 text-center sm:pb-6">
              <div className="mb-0.5 flex justify-center sm:mb-1">
                <UsernameDisplay
                  username={profileUsername}
                  isPremium={isPremium}
                  className="text-lg font-black tracking-tight text-white sm:text-xl"
                  iconSize="w-4 h-4"
                />
              </div>
              <p className="text-xs font-medium text-white/85 sm:text-sm">{profileName}</p>
            </div>
          </motion.div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="mb-4 hidden text-sm font-bold uppercase tracking-[0.24em] text-gray-400 lg:block">Share Apps</p>
          <div className="grid grid-cols-6 gap-1.5 lg:flex-1 lg:auto-rows-fr lg:grid-cols-3 lg:gap-3">
            {shareApps.map((app) => (
              <button
                key={app.key}
                onClick={app.onClick}
                className="flex h-auto min-w-0 items-center justify-center rounded-none border-0 bg-transparent p-0 text-center text-white transition-colors lg:h-full lg:min-h-[96px] lg:rounded-[24px] lg:border lg:border-white/10 lg:bg-white/[0.03] lg:px-3 lg:py-3 lg:hover:bg-white/[0.06]"
                title={app.title}
                aria-label={app.title}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${app.iconBoxClassName} sm:h-10 sm:w-10 lg:h-11 lg:w-11 lg:rounded-2xl`}>
                  {app.icon}
                </div>
                <p className={`hidden max-w-full text-xs font-semibold leading-tight lg:block ${app.key === 'copy' && copied ? 'text-green-400' : 'text-white'}`}>
                  {app.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[110]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-4 top-1/2 z-[120] flex max-h-[88vh] -translate-y-1/2 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0f1115]/80 shadow-2xl backdrop-blur-xl lg:hidden sm:inset-x-auto sm:left-1/2 sm:w-[420px] sm:-translate-x-1/2"
          >
            {renderHeader()}
            {renderContent()}
          </motion.div>

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-4 bottom-4 right-4 z-[120] hidden w-[400px] flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#0f1115]/80 shadow-2xl backdrop-blur-xl lg:flex"
          >
            {renderHeader()}
            {renderContent()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
