'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const WHATS_NEW_VERSION = '2026-07-whats-new-compact';
const STORAGE_KEY = 'cinexium:whats-new:last-seen';

const FEATURES = [
  {
    title: 'Notification controls are now clearer',
    description: 'Push and in-app notification preferences are easier to review, with a cleaner master switch and better per-alert controls.',
  },
  {
    title: 'Loading previews across the app',
    description: 'More pages now introduce content with polished skeleton previews while everything loads in.',
  },
];

export function WhatsNewModal() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const shouldSuppressOnRoute = useMemo(() => {
    if (!pathname) return false;
    return pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/verify-otp');
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined' || shouldSuppressOnRoute) {
      return;
    }

    const lastSeenVersion = window.localStorage.getItem(STORAGE_KEY);
    if (lastSeenVersion !== WHATS_NEW_VERSION) {
      setIsOpen(true);
    }
  }, [shouldSuppressOnRoute]);

  const closeModal = () => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, WHATS_NEW_VERSION);
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 240 }}
            className="fixed left-1/2 top-1/2 z-[150] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-[#12161f]/96 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] md:px-5 md:pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-500">New In Cinexium</p>
                <h2 className="mt-1.5 text-xl font-bold leading-tight text-white">A quicker, cleaner update summary.</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                  Only the latest improvements are shown here, with a maximum of two highlights at a time.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close what's new"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2.5">
              {FEATURES.map((feature, index) => (
                <div key={feature.title} className="rounded-2xl border border-white/8 bg-white/5 p-3.5">
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/15 text-xs font-bold text-primary-500">
                      {index + 1}
                    </div>
                    <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-2xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(229,9,20,0.22)] transition-colors hover:bg-primary-600"
              >
                Explore What's New
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Later
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
