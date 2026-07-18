'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SettingsPageBoneyard } from '@/components/skeleton/Boneyard';
import { ClientBackButton } from '@/components/ui/ClientBackButton';

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.ok) {
          const data = await res.json();
          setChatNotifications(data.user.chatNotifications ?? true);
          setAppNotifications(data.user.appNotifications ?? true);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [router]);

  const toggleSetting = async (setting: 'chat' | 'app') => {
    if (saving) return;
    setSaving(true);
    
    const newValue = setting === 'chat' ? !chatNotifications : !appNotifications;
    
    if (setting === 'chat') setChatNotifications(newValue);
    else setAppNotifications(newValue);

    try {
      await fetch('/api/user/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(setting === 'chat' ? { chatNotifications: newValue } : { appNotifications: newValue })
        })
      });
      // Optionally refresh the router to update global unread dot states
      router.refresh();
    } catch (err) {
      console.error(err);
      // Revert on failure
      if (setting === 'chat') setChatNotifications(!newValue);
      else setAppNotifications(!newValue);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SettingsPageBoneyard />;
  }

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">Notification Preferences</h1>
      </div>

      <div className="bg-[#1a1d24] rounded-2xl p-6 md:p-8 shadow-xl border border-white/5 space-y-6">
        
        {/* App Notifications Toggle */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">App Notifications</h2>
            <p className="text-sm text-gray-400">Receive alerts for follows, likes, and replies.</p>
          </div>
          <button 
            onClick={() => toggleSetting('app')}
            disabled={saving}
            className={`w-14 h-8 rounded-full transition-colors relative ${appNotifications ? 'bg-primary-500' : 'bg-gray-600'} disabled:opacity-50`}
            aria-pressed={appNotifications}
          >
            <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${appNotifications ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Chat Notifications Toggle */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Chat Notifications</h2>
            <p className="text-sm text-gray-400">Receive alerts for new direct messages.</p>
          </div>
          <button 
            onClick={() => toggleSetting('chat')}
            disabled={saving}
            className={`w-14 h-8 rounded-full transition-colors relative ${chatNotifications ? 'bg-primary-500' : 'bg-gray-600'} disabled:opacity-50`}
            aria-pressed={chatNotifications}
          >
            <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${chatNotifications ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
