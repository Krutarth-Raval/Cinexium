import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

type FirebaseAdminConfigStatus = {
  configured: boolean;
  missing: string[];
};

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
}

export function getFirebaseAdminConfigStatus(): FirebaseAdminConfigStatus {
  const missing: string[] = [];

  if (!process.env.FIREBASE_PROJECT_ID) {
    missing.push('FIREBASE_PROJECT_ID');
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    missing.push('FIREBASE_CLIENT_EMAIL');
  }

  if (!getPrivateKey()) {
    missing.push('FIREBASE_PRIVATE_KEY');
  }

  return {
    configured: missing.length === 0,
    missing,
  };
}

function getFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export function getFirebaseAdminMessaging() {
  const app = getFirebaseAdminApp();
  return app ? getMessaging(app) : null;
}
