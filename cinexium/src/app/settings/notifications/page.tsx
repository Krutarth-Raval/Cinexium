'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from 'firebase/messaging';
import { SettingsPageBoneyard } from '@/components/skeleton/Boneyard';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { getFirebaseMessagingClient, hasFirebaseMessagingConfig } from '@/lib/push/client';
import { PUSH_SERVICE_WORKER_URL } from '@/lib/push/constants';

type NotificationSettings = {
  chatNotifications: boolean;
  appNotifications: boolean;
  pushNotificationsEnabled: boolean;
  directMessagePush: boolean;
  groupMessagePush: boolean;
  communityMentionPush: boolean;
  commentReplyPush: boolean;
  commentLikePush: boolean;
  groupInvitePush: boolean;
  communityInvitePush: boolean;
  followPush: boolean;
  collectionSharePush: boolean;
  watchlistReleasePush: boolean;
  adminAnnouncementPush: boolean;
};

const pushRows: Array<{ key: keyof NotificationSettings; title: string; description: string }> = [
  { key: 'directMessagePush', title: 'Direct Messages', description: 'New one-to-one chat messages.' },
  { key: 'groupMessagePush', title: 'Group Messages', description: 'New messages and mentions in groups.' },
  { key: 'communityMentionPush', title: 'Community Mentions', description: 'Mentions inside communities.' },
  { key: 'commentReplyPush', title: 'Comment Replies', description: 'Replies to your comments.' },
  { key: 'commentLikePush', title: 'Comment Likes', description: 'Likes on your comments.' },
  { key: 'groupInvitePush', title: 'Group Invites', description: 'Invites and additions to groups.' },
  { key: 'communityInvitePush', title: 'Community Invites', description: 'Community invites and approvals.' },
  { key: 'followPush', title: 'Follow Notifications', description: 'Follows and follow-request updates.' },
  { key: 'collectionSharePush', title: 'Collection Shares', description: 'Collections shared with you.' },
  { key: 'watchlistReleasePush', title: 'Watchlist Releases', description: 'New episodes, seasons, and release availability.' },
  { key: 'adminAnnouncementPush', title: 'Admin Announcements', description: 'Important announcements and maintenance alerts.' },
];

const defaultSettings: NotificationSettings = {
  chatNotifications: true,
  appNotifications: true,
  pushNotificationsEnabled: true,
  directMessagePush: true,
  groupMessagePush: true,
  communityMentionPush: true,
  commentReplyPush: true,
  commentLikePush: true,
  groupInvitePush: true,
  communityInvitePush: true,
  followPush: true,
  collectionSharePush: true,
  watchlistReleasePush: true,
  adminAnnouncementPush: true,
};

function ToggleRow({
  title,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1d24] ${
          enabled
            ? 'border-primary-400/40 bg-primary-500 shadow-[0_0_20px_rgba(236,72,153,0.22)]'
            : 'border-white/10 bg-white/12'
        } ${disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'}`}
        aria-pressed={enabled}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${title}`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-[0_4px_12px_rgba(15,23,42,0.35)] transition-transform duration-200 ${
            enabled ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setSettings({
            chatNotifications: data.user.chatNotifications ?? true,
            appNotifications: data.user.appNotifications ?? true,
            pushNotificationsEnabled: data.user.pushNotificationsEnabled ?? true,
            directMessagePush: data.user.directMessagePush ?? true,
            groupMessagePush: data.user.groupMessagePush ?? true,
            communityMentionPush: data.user.communityMentionPush ?? true,
            commentReplyPush: data.user.commentReplyPush ?? true,
            commentLikePush: data.user.commentLikePush ?? true,
            groupInvitePush: data.user.groupInvitePush ?? true,
            communityInvitePush: data.user.communityInvitePush ?? true,
            followPush: data.user.followPush ?? true,
            collectionSharePush: data.user.collectionSharePush ?? true,
            watchlistReleasePush: data.user.watchlistReleasePush ?? true,
            adminAnnouncementPush: data.user.adminAnnouncementPush ?? true,
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettings();
  }, [router]);

  const pushSupported = useMemo(
    () => typeof window !== 'undefined' && 'serviceWorker' in navigator && hasFirebaseMessagingConfig(),
    []
  );

  const updateSettings = async (patch: Partial<NotificationSettings>) => {
    setSaving(true);
    const previous = settings;
    setSettings((current) => ({ ...current, ...patch }));

    try {
      const response = await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        throw new Error(`Failed to update notification settings (${response.status})`);
      }
      router.refresh();
      return true;
    } catch (error) {
      console.error(error);
      setSettings(previous);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const syncPushPermission = async (nextPermission: NotificationPermission, enabled: boolean) => {
    setPermission(nextPermission);

    const deviceId = window.localStorage.getItem('cinexium_push_device_id');
    if (!deviceId) {
      return;
    }

    if (nextPermission !== 'granted') {
      await fetch('/api/push/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, permission: nextPermission, enabled }),
      });
      return;
    }

    const registration = await navigator.serviceWorker.register(PUSH_SERVICE_WORKER_URL);
    await registration.update().catch(() => {});
    const messaging = await getFirebaseMessagingClient();
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = messaging && vapidKey
      ? await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration }).catch(() => null)
      : null;

    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
      navigator.platform ||
      'web';
    const browser = navigator.userAgent.includes('Edg/')
      ? 'Edge'
      : navigator.userAgent.includes('Chrome/') && !navigator.userAgent.includes('Edg/')
        ? 'Chrome'
        : navigator.userAgent.includes('Firefox/')
          ? 'Firefox'
          : navigator.userAgent.includes('Safari/') && !navigator.userAgent.includes('Chrome/')
            ? 'Safari'
            : navigator.userAgent.includes('SamsungBrowser/')
              ? 'Samsung Internet'
              : 'Unknown';

    await fetch('/api/push/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId,
        permission: nextPermission,
        enabled,
        token,
        platform,
        browser,
        userAgent: navigator.userAgent,
      }),
    });
  };

  const togglePushEnabled = async () => {
    const nextValue = !settings.pushNotificationsEnabled;

    if (nextValue && permission === 'denied') {
      return;
    }

    if (nextValue && pushSupported && permission === 'default') {
      const nextPermission = await Notification.requestPermission();
      await syncPushPermission(nextPermission, true);
      if (nextPermission !== 'granted') {
        return;
      }
    }

    const didSave = await updateSettings({ pushNotificationsEnabled: nextValue });

    if (didSave && pushSupported) {
      const browserPermission = typeof Notification === 'undefined' ? 'default' : Notification.permission;
      await syncPushPermission(browserPermission, nextValue);
    }
  };

  const permissionMessage =
    permission === 'granted'
      ? 'Browser permission is granted, so Cinexium can send push notifications.'
      : permission === 'denied'
        ? 'Your browser is blocking notifications right now. You will need to allow them in the browser/site settings first.'
        : 'Push toggles are on, but the browser still needs your permission before any notification can be delivered.';

  if (loading) {
    return <SettingsPageBoneyard />;
  }

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Notification Preferences</h1>
      </div>

      <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.24em] mb-4">Existing In-App</h2>
          <ToggleRow
            title="App Notifications"
            description="Receive in-app alerts for follows, likes, and replies."
            enabled={settings.appNotifications}
            disabled={saving}
            onToggle={() => updateSettings({ appNotifications: !settings.appNotifications })}
          />
          <ToggleRow
            title="Chat Notifications"
            description="Keep the existing unread indicators for direct chats."
            enabled={settings.chatNotifications}
            disabled={saving}
            onToggle={() => updateSettings({ chatNotifications: !settings.chatNotifications })}
          />
        </div>

        <div>
          <div className="mb-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.24em]">Push Notifications</h2>
            <p className="text-sm text-gray-500 mt-2">
              Web push is only sent when Cinexium is offline or in the background.
              {!pushSupported ? ' Firebase push is not configured for this environment yet.' : ''}
            </p>
            {pushSupported && (
              <p className={`text-sm mt-2 ${permission === 'granted' ? 'text-emerald-300/80' : 'text-amber-300/80'}`}>
                {permissionMessage}
              </p>
            )}
          </div>

          <ToggleRow
            title="General Push Notifications"
            description="Master switch for push delivery on desktop and Android browsers."
            enabled={settings.pushNotificationsEnabled}
            disabled={saving || !pushSupported}
            onToggle={togglePushEnabled}
          />

          <div className={`mt-2 rounded-2xl ${settings.pushNotificationsEnabled ? '' : 'opacity-60'}`}>
            {pushRows.map((row) => (
              <ToggleRow
                key={row.key}
                title={row.title}
                description={row.description}
                enabled={settings.pushNotificationsEnabled && settings[row.key]}
                disabled={saving || !settings.pushNotificationsEnabled}
                onToggle={() => updateSettings({ [row.key]: !settings[row.key] } as Partial<NotificationSettings>)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
