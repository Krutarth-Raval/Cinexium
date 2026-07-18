'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from 'firebase/messaging';
import { SettingsPageBoneyard } from '@/components/skeleton/Boneyard';
import { ClientBackButton } from '@/components/ui/ClientBackButton';
import { getFirebaseMessagingClient, hasFirebaseMessagingConfig } from '@/lib/push/client';

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
      <div>
        <h2 className="text-base font-bold text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        className={`w-14 h-8 rounded-full transition-colors relative ${enabled ? 'bg-primary-500' : 'bg-gray-600'} disabled:opacity-50`}
        aria-pressed={enabled}
      >
        <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
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
      await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      router.refresh();
    } catch (error) {
      console.error(error);
      setSettings(previous);
    } finally {
      setSaving(false);
    }
  };

  const syncPushPermission = async (nextPermission: NotificationPermission) => {
    setPermission(nextPermission);

    const deviceId = window.localStorage.getItem('cinexium_push_device_id');
    if (!deviceId) {
      return;
    }

    if (nextPermission !== 'granted') {
      await fetch('/api/push/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, permission: nextPermission }),
      });
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
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
        token,
        platform,
        browser,
        userAgent: navigator.userAgent,
      }),
    });
  };

  const togglePushEnabled = async () => {
    const nextValue = !settings.pushNotificationsEnabled;

    if (nextValue && pushSupported && permission === 'default') {
      const nextPermission = await Notification.requestPermission();
      await syncPushPermission(nextPermission);
      if (nextPermission !== 'granted') {
        return;
      }
    }

    await updateSettings({ pushNotificationsEnabled: nextValue });
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
            disabled={saving || !pushSupported || permission === 'denied'}
            onToggle={togglePushEnabled}
          />

          <div className={`mt-2 rounded-2xl ${settings.pushNotificationsEnabled ? '' : 'opacity-60'}`}>
            {pushRows.map((row) => (
              <ToggleRow
                key={row.key}
                title={row.title}
                description={row.description}
                enabled={settings[row.key]}
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
