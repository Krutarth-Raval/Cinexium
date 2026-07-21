'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function PushBootstrap() {
  usePushNotifications();
  return null;
}

function RouteScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RouteScrollReset />
      <PushBootstrap />
      {children}
    </SessionProvider>
  );
}
