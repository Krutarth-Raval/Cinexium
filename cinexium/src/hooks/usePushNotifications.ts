'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessagingClient, hasFirebaseMessagingConfig } from '@/lib/push/client';
import {
  PUSH_HEARTBEAT_MS,
  PUSH_PROMPT_COOLDOWN_MS,
} from '@/lib/push/constants';
import { getPageContext, isForegroundVisible } from '@/lib/push/presence';

const DEVICE_ID_KEY = 'cinexium_push_device_id';
const LAST_PROMPT_AT_KEY = 'cinexium_push_last_prompt_at';
const HAS_INTERACTED_KEY = 'cinexium_push_has_interacted';

function getDeviceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('SamsungBrowser/')) return 'Samsung Internet';
  return 'Unknown';
}

function ensureDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = getDeviceId();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

async function sendPresence(deviceId: string, pathname: string) {
  const locationPath = `${pathname}${window.location.hash || ''}`;
  const { pageType, pageTargetId } = getPageContext(locationPath);

  await fetch('/api/push/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      pathname: locationPath,
      pageType,
      pageTargetId,
      isVisible: document.visibilityState === 'visible',
      isFocused: document.hasFocus(),
    }),
  }).catch(() => {});
}

async function registerToken(deviceId: string, permission: NotificationPermission, currentToken?: string | null) {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    'web';
  const browser = detectBrowser();

  await fetch('/api/push/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId,
      token: currentToken,
      permission,
      platform,
      browser,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
}

export function usePushNotifications() {
  const { status } = useSession();
  const pathname = usePathname();
  const promptTimerRef = useRef<number | null>(null);
  const promptedThisVisitRef = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !pathname || !hasFirebaseMessagingConfig()) {
      return;
    }

    const deviceId = ensureDeviceId();
    void sendPresence(deviceId, pathname);

    const handlePresence = () => {
      void sendPresence(deviceId, pathname);
    };

    const intervalId = window.setInterval(handlePresence, PUSH_HEARTBEAT_MS);
    window.addEventListener('focus', handlePresence);
    window.addEventListener('visibilitychange', handlePresence);
    window.addEventListener('pageshow', handlePresence);
    window.addEventListener('hashchange', handlePresence);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handlePresence);
      window.removeEventListener('visibilitychange', handlePresence);
      window.removeEventListener('pageshow', handlePresence);
      window.removeEventListener('hashchange', handlePresence);
    };
  }, [pathname, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !pathname || !hasFirebaseMessagingConfig()) {
      return;
    }

    let cancelled = false;
    let unsubscribeFromMessages: (() => void) | null = null;
    const deviceId = ensureDeviceId();

    const initMessaging = async () => {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = await getFirebaseMessagingClient();
      if (!messaging || cancelled) {
        return;
      }

      unsubscribeFromMessages = onMessage(messaging, (payload) => {
        window.dispatchEvent(new CustomEvent('push:payload', { detail: payload }));
      });

      if (cancelled) {
        unsubscribeFromMessages?.();
        return;
      }

      if (Notification.permission === 'granted') {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const token = vapidKey
          ? await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(() => null)
          : null;

        await registerToken(deviceId, 'granted', token);
      } else {
        await registerToken(deviceId, Notification.permission);
      }
    };

    void initMessaging();

    return () => {
      cancelled = true;
      unsubscribeFromMessages?.();
    };
  }, [pathname, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !hasFirebaseMessagingConfig()) {
      return;
    }

    if (Notification.permission !== 'default') {
      return;
    }

    const lastPromptAt = Number(window.localStorage.getItem(LAST_PROMPT_AT_KEY) || '0');
    const hasWaitedLongEnough = Date.now() - lastPromptAt >= PUSH_PROMPT_COOLDOWN_MS;
    if (!hasWaitedLongEnough || promptedThisVisitRef.current) {
      return;
    }

    const requestPermissionAfterInteraction = async () => {
      if (promptedThisVisitRef.current) {
        return;
      }

      if (!isForegroundVisible(document.visibilityState)) {
        return;
      }

      promptedThisVisitRef.current = true;
      window.localStorage.setItem(LAST_PROMPT_AT_KEY, String(Date.now()));
      const permission = await Notification.requestPermission();
      const deviceId = ensureDeviceId();

      if (permission === 'granted') {
        const messaging = await getFirebaseMessagingClient();
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        const token = messaging && vapidKey
          ? await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(() => null)
          : null;
        await registerToken(deviceId, permission, token);
      } else {
        await registerToken(deviceId, permission);
      }
    };

    const handleInteraction = () => {
      window.localStorage.setItem(HAS_INTERACTED_KEY, '1');
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current);
      }

      promptTimerRef.current = window.setTimeout(() => {
        void requestPermissionAfterInteraction();
      }, 800);
    };

    const interactionEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    interactionEvents.forEach((eventName) =>
      window.addEventListener(eventName, handleInteraction, { passive: true, once: true })
    );

    if (window.localStorage.getItem(HAS_INTERACTED_KEY) === '1') {
      handleInteraction();
    }

    return () => {
      if (promptTimerRef.current) {
        window.clearTimeout(promptTimerRef.current);
      }

      interactionEvents.forEach((eventName) =>
        window.removeEventListener(eventName, handleInteraction)
      );
    };
  }, [status]);
}
