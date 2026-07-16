'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ClientBackButton } from '@/components/ui/ClientBackButton';

type AdminUser = {
  role?: string | null;
};

type SubscriptionNotification = {
  id: string;
  requestId: string | null;
  plan: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
};

type SubscriptionRequest = {
  id: string;
  userId: string;
  avatar: string | null;
  username: string;
  email: string;
  plan: string;
  status: string;
  statusLabel: string;
  paymentEmailSent: boolean;
  paymentEmailSentAt: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  requestedAt: string;
};

type SubscriptionRequestsResponse = {
  requests?: SubscriptionRequest[];
  notifications?: SubscriptionNotification[];
  storageReady?: boolean;
  error?: string;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatRelative(dateString: string) {
  const timestamp = new Date(dateString).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'EXPIRED':
      return 'Expired';
    case 'WAITING_FOR_PAYMENT':
      return 'Waiting For Payment';
    case 'PENDING':
      return 'Pending Request';
    default:
      return status;
  }
}

export default function UserSubscriptionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [notifications, setNotifications] = useState<SubscriptionNotification[]>([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [userRes, requestsRes] = await Promise.all([
        fetch('/api/user/me'),
        fetch('/api/admin/subscription-requests'),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);

        if (userData.user?.role !== 'admin') {
          router.push('/settings/account');
          return;
        }
      } else {
        router.push('/login');
        return;
      }

      if (!requestsRes.ok) {
        const data = await requestsRes.json().catch(() => null);
        throw new Error(data?.error || 'Failed to load subscription requests.');
      }

      const data = await requestsRes.json() as SubscriptionRequestsResponse;
      setRequests(data.requests ?? []);
      setNotifications(data.notifications ?? []);
      setError(data.storageReady === false ? (data.error || 'Subscription request storage is not ready yet.') : '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    const interval = window.setInterval(() => {
      void loadData();
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  const markNotificationAsRead = async (notificationId: string) => {
    await fetch('/api/admin/subscription-notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId }),
    });

    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
  };

  const handleSendPaymentEmail = async (requestId: string) => {
    try {
      setBusyId(requestId);
      const response = await fetch(`/api/admin/subscription-requests/${requestId}/payment-email`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to send payment email.');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send payment email.');
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (requestId: string) => {
    try {
      setBusyId(requestId);
      const response = await fetch(`/api/admin/subscription-requests/${requestId}/activate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to activate subscription.');
      }

      const data = await response.json().catch(() => null);

      if (data?.request) {
        setRequests((current) =>
          current.map((request) =>
            request.id === requestId
              ? {
                  ...request,
                  status: data.request.status,
                  statusLabel: getStatusLabel(data.request.status),
                  activatedAt: data.request.activatedAt,
                  expiresAt: data.request.expiresAt,
                }
              : request
          )
        );
      }

      void loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate subscription.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen pt-4 md:pt-24 pb-24 px-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <ClientBackButton />
        <h1 className="text-xl md:text-3xl font-bold text-white">User Subscriptions</h1>
      </div>

      <div className="space-y-4">
        {notifications.map((notification) => (
          <button
            key={notification.id}
            onClick={async () => {
              await markNotificationAsRead(notification.id);
              if (notification.requestId) {
                document.getElementById(notification.requestId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="w-full text-left rounded-2xl border border-yellow-400/25 bg-yellow-400/10 p-4 transition-colors hover:bg-yellow-400/15"
          >
            <p className="text-yellow-300 font-semibold mb-1">New Premium Request</p>
            <p className="text-white text-sm">
              {notification.actor.name || notification.actor.username} requested {notification.plan === 'yearly' ? 'Yearly' : 'Monthly'} Premium.
            </p>
            <p className="text-xs text-yellow-100/70 mt-2">{formatRelative(notification.createdAt)}</p>
          </button>
        ))}

        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-[#1a1d24] p-6 text-center text-gray-400">
            No subscription requests yet.
          </div>
        ) : (
          requests.map((request) => {
            const isMonthly = request.plan === 'monthly';
            const isActive = request.status === 'ACTIVE';
            const activationDisabled = isActive || !request.paymentEmailSent || busyId === request.id;

            return (
              <div
                key={request.id}
                id={request.id}
                className="rounded-3xl border border-white/5 bg-[#1a1d24] p-5 shadow-xl"
              >
                <div className="flex items-start gap-4">
                  {request.avatar ? (
                    <img src={request.avatar} alt={request.username} className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-red-800 flex items-center justify-center text-white font-bold text-xl">
                      {request.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-semibold">@{request.username}</p>
                        <p className="text-sm text-gray-400 break-all">{request.email}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isActive ? 'bg-green-500/15 text-green-300' : request.status === 'EXPIRED' ? 'bg-gray-500/15 text-gray-300' : 'bg-yellow-500/15 text-yellow-300'}`}>
                        {request.statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-gray-400 mb-1">Requested Plan</p>
                        <p className="text-white font-medium">{isMonthly ? 'Monthly' : 'Yearly'}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-gray-400 mb-1">Requested Date</p>
                        <p className="text-white font-medium">{formatDate(request.requestedAt)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-gray-400 mb-1">Requested Time</p>
                        <p className="text-white font-medium">{formatTime(request.requestedAt)}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-gray-400 mb-1">Current Status</p>
                        <p className="text-white font-medium">{request.statusLabel}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/5 bg-[#0f1115] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-white font-medium">
                            {isMonthly ? 'Monthly Subscription' : 'Yearly Subscription'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {isActive && request.expiresAt ? `Active until ${formatDate(request.expiresAt)}` : 'Awaiting manual activation'}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={activationDisabled}
                          onClick={() => {
                            if (!activationDisabled) {
                              void handleActivate(request.id);
                            }
                          }}
                          className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${isActive ? 'bg-green-500/80 cursor-not-allowed' : activationDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-white/15 hover:bg-white/20'}`}
                          aria-pressed={isActive}
                        >
                          <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-9' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4">
                      {!request.paymentEmailSent ? (
                        <button
                          onClick={() => void handleSendPaymentEmail(request.id)}
                          disabled={busyId === request.id}
                          className="w-full rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-purple-400 hover:to-fuchsia-500 disabled:cursor-wait disabled:opacity-70"
                        >
                          {busyId === request.id ? 'Sending...' : 'Send Payment Email'}
                        </button>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-500/15 px-3 py-1 text-sm font-semibold text-green-300">
                          Payment Email Sent
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
