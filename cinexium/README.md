# Cinexium

Cinexium is a Next.js App Router application for movie and series discovery, chat, collections, comments, and social activity.

## Core Features

- Direct, group, and community chat
- Comments, replies, and comment likes
- Collections and content sharing
- In-app notifications and unread indicators
- Firebase Cloud Messaging web push notifications
- Per-device push token storage with Prisma
- User presence tracking for exact-page push suppression

## Push Notification Model

Cinexium now supports web push notifications on desktop and Android browsers with Firebase Cloud Messaging.

- Push is additive and does not replace the existing notification panel
- Notifications are suppressed only when the recipient is connected, the tab is visible, the window is focused, and the user is viewing the exact related resource
- Each user can have multiple push devices
- Invalid or expired tokens are removed automatically
- Notification preferences are configurable in Settings

### Supported Push Categories

- Direct messages
- Group messages
- Community mentions
- Comment replies
- Comment likes
- Group invites
- Community invites
- Follow notifications
- Collection shares
- Watchlist releases
- Admin announcements

## Environment Variables

### App

```env
NEXT_PUBLIC_TMDB_API_KEY=
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
```

### Firebase Web

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
```

### Firebase Admin

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Optional Premium Request Support

```env
EMAIL_USER=
EMAIL_PASS=
UPI_ID=
```

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run a production build:

```bash
npm run build
```

Run a standalone TypeScript check:

```bash
npx tsc --noEmit
```

## Database Notes

The push notification system adds Prisma models for:

- `PushDevice`
- `PresenceSession`
- `NotificationPreference`

The migration is non-destructive and is designed to work alongside the existing notification system.
