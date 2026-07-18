'use client';

import { SessionProvider } from 'next-auth/react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

function PushBootstrap() {
  usePushNotifications();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PushBootstrap />
      {children}
    </SessionProvider>
  );
}
