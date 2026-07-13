import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const globalForSecurity = globalThis as typeof globalThis & {
  __cinexiumRateLimitStore__?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalForSecurity.__cinexiumRateLimitStore__ ??
  (globalForSecurity.__cinexiumRateLimitStore__ = new Map<string, RateLimitEntry>());

export const AUTH_ERROR_MESSAGE = 'Invalid credentials';
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 1000;
export const MAX_COLLECTION_NAME_LENGTH = 80;
export const MAX_COLLECTION_DESCRIPTION_LENGTH = 500;
export const MAX_GROUP_NAME_LENGTH = 80;

const allowedNotificationTypes = new Set([
  'FOLLOW',
  'FOLLOW_REQUEST',
  'REQUEST_ACCEPTED',
  'COMMENT_REPLY',
  'COMMUNITY_JOIN_REQUEST',
  'COMMUNITY_JOIN_ACCEPTED',
]);

export function getClientIp(request: Request | NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function applyRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return { allowed: true, remaining: limit - existing.count };
}

export function rateLimitResponse(retryAfterMs = 60_000) {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfterSeconds.toString(),
      },
    }
  );
}

export function enforceSameOrigin(request: Request | NextRequest) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin || !host) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  try {
    const originUrl = new URL(origin);
    if (originUrl.host !== host) {
      return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  return null;
}

export function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return '';

  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function normalizeIdentifier(value: unknown, maxLength: number) {
  return normalizeText(value, maxLength).toLowerCase();
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function generateInviteCode() {
  return crypto.randomBytes(8).toString('hex');
}

export function isValidOtp(value: unknown) {
  return typeof value === 'string' && /^\d{6}$/.test(value);
}

export function isValidPin(value: unknown) {
  return typeof value === 'string' && /^\d{4}$/.test(value);
}

export function isValidNotificationType(value: unknown): value is string {
  return typeof value === 'string' && allowedNotificationTypes.has(value);
}

export function isValidPlan(value: unknown): value is 'monthly' | 'yearly' {
  return value === 'monthly' || value === 'yearly';
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

