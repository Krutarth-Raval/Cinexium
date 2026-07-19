export const dynamic = 'force-dynamic';

export async function GET() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  };

  const source = `
    importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js');

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};
    const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId && firebaseConfig.appId;

    if (hasConfig) {
      firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();

      messaging.onBackgroundMessage(async (payload) => {
        const data = payload?.data || {};

        if (data.op === 'clear') {
          const notifications = await self.registration.getNotifications({ tag: data.tag || undefined });
          notifications.forEach((notification) => {
            const eventKey = notification.data?.eventKey || '';
            const notificationId = notification.data?.notificationId || '';
            if ((!data.eventKey || data.eventKey === eventKey) && (!data.notificationId || data.notificationId === notificationId)) {
              notification.close();
            }
          });
          return;
        }

        if (data.op !== 'show') return;

        const existingNotifications = await self.registration.getNotifications();
        const hasMatchingEventKey = existingNotifications.some(
          (notification) => notification.data?.eventKey && notification.data.eventKey === data.eventKey
        );
        if (hasMatchingEventKey) {
          return;
        }

        await self.registration.showNotification(data.title || 'Cinexium', {
          body: data.body || '',
          icon: data.icon || '/icon-192.png',
          image: data.image || undefined,
          badge: data.badge || '/icon-192.png',
          tag: data.tag || data.eventKey || undefined,
          timestamp: data.timestamp ? Number(data.timestamp) : Date.now(),
          data: {
            deepLink: data.deepLink || '/',
            type: data.type || 'GENERAL',
            eventKey: data.eventKey || '',
            notificationId: data.notificationId || '',
            tag: data.tag || data.eventKey || '',
          },
        });
      });
    }

    self.addEventListener('notificationclick', (event) => {
      event.notification.close();
      const data = event.notification.data || {};
      const deepLink = new URL(data.deepLink || '/', self.location.origin).toString();

      event.waitUntil((async () => {
        if (data.notificationId || data.eventKey) {
          await fetch('/api/push/handle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              notificationId: data.notificationId || null,
              eventKey: data.eventKey || null,
              tag: data.tag || null,
            }),
          }).catch(() => null);
        }

        const clientsList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        const preferredClient = clientsList.find((client) => client.url.startsWith(self.location.origin)) || clientsList[0];
        if (preferredClient && 'focus' in preferredClient) {
          await preferredClient.focus();
          if ('navigate' in preferredClient) {
            await preferredClient.navigate(deepLink);
          }
          return;
        }

        for (const client of clientsList) {
          if ('focus' in client) {
            await client.focus();
            if ('navigate' in client) {
              await client.navigate(deepLink);
            }
            return;
          }
        }

        await clients.openWindow(deepLink);
      })());
    });
  `;

  return new Response(source, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
    },
  });
}
