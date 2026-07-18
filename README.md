# Cinexium

Discover your next favorite movie or TV series with chat, collections, social activity, and smart notifications.

[Live Demo](https://cinexium.site)

## What You Can Do

- Smart discovery across movies and series
- Powerful search and detailed title pages
- Direct, group, and community chat
- Comments, replies, and likes
- Collections and content sharing
- In-app notifications and unread indicators
- Web push notifications with Firebase Cloud Messaging

## Push Notification Highlights

- Supports desktop and Android browsers
- Uses Firebase Cloud Messaging for delivery
- Stores multiple devices per user
- Tracks platform, browser, `createdAt`, and `lastSeenAt`
- Removes invalid tokens automatically
- Suppresses push only when the recipient is actively viewing the exact related resource
- Keeps the existing in-app notification system unchanged

## Getting Started

```bash
git clone https://github.com/Krutarth-Raval/Cinexium.git
cd Cinexium/cinexium
npm install
npm run dev
```

## Main Environment Variables

```env
NEXT_PUBLIC_TMDB_API_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## Tech Stack

- Next.js App Router
- TypeScript
- Prisma
- Firebase Cloud Messaging
- Vercel

## Author

Krutarth Raval  
GitHub: [@Krutarth-Raval](https://github.com/Krutarth-Raval)
