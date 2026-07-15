import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { getPaddleWebhookSecret } from '@/lib/payments/paddle-config';

export const runtime = 'nodejs';

type PaddleWebhookEnvelope = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: Record<string, unknown>;
};

function parsePaddleSignatureHeader(headerValue: string | null) {
  if (!headerValue) {
    return null;
  }

  const pairs = headerValue.split(';').map((segment) => segment.trim()).filter(Boolean);
  const values = new Map<string, string>();

  for (const pair of pairs) {
    const [key, ...rest] = pair.split('=');
    if (!key || rest.length === 0) {
      continue;
    }

    values.set(key, rest.join('='));
  }

  const timestamp = values.get('ts');
  const signature = values.get('h1');

  if (!timestamp || !signature) {
    return null;
  }

  return { timestamp, signature };
}

function verifyPaddleSignature(payload: string, signatureHeader: string | null, secret: string) {
  const parsedSignature = parsePaddleSignatureHeader(signatureHeader);

  if (!parsedSignature) {
    return false;
  }

  const signedPayload = `${parsedSignature.timestamp}:${payload}`;
  const expectedSignature = crypto.createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex');

  const providedSignature = parsedSignature.signature.toLowerCase();
  const normalizedExpectedSignature = expectedSignature.toLowerCase();

  const providedBuffer = Buffer.from(providedSignature, 'utf8');
  const expectedBuffer = Buffer.from(normalizedExpectedSignature, 'utf8');

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function getRecordValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === 'string' ? value : null;
}

async function handleKnownEvent(event: PaddleWebhookEnvelope) {
  const eventType = event.event_type ?? 'unknown';
  const eventId = event.event_id ?? 'unknown';
  const entityId = getRecordValue(event.data, 'id');
  const subscriptionId =
    getRecordValue(event.data, 'subscription_id') ||
    getRecordValue(event.data, 'subscriptionId') ||
    entityId;
  const transactionId =
    getRecordValue(event.data, 'transaction_id') ||
    getRecordValue(event.data, 'transactionId') ||
    entityId;

  switch (eventType) {
    case 'transaction.completed': {
      console.info('Paddle webhook received', {
        eventType,
        eventId,
        transactionId,
        subscriptionId,
      });

      // TODO: Persist the completed transaction and map it to the Cinexium user.
      // TODO: If this transaction creates or renews a subscription, store the
      // Paddle transaction/subscription identifiers for later reconciliation.
      // TODO: Trigger premium entitlement activation or renewal after the
      // subscription state is confirmed in the database.
      return;
    }

    case 'subscription.activated': {
      console.info('Paddle webhook received', {
        eventType,
        eventId,
        subscriptionId,
      });

      // TODO: Activate the user's premium subscription in the database.
      // TODO: Store Paddle subscription metadata such as status, next billing
      // date, price identifiers, and customer identifiers for future webhooks.
      // TODO: Grant Cinexium Pro entitlements here once a user mapping exists.
      return;
    }

    case 'subscription.updated': {
      console.info('Paddle webhook received', {
        eventType,
        eventId,
        subscriptionId,
      });

      // TODO: Update subscription status, billing dates, and plan metadata.
      // TODO: Handle renewals, pauses, scheduled cancellations, or plan changes.
      // TODO: Reconcile Cinexium Pro entitlements if Paddle status changes affect
      // access or renewal windows.
      return;
    }

    case 'subscription.canceled': {
      console.info('Paddle webhook received', {
        eventType,
        eventId,
        subscriptionId,
      });

      // TODO: Mark the subscription as canceled in the database.
      // TODO: Decide whether premium access ends immediately or at the end of
      // the current billing period based on stored Paddle subscription dates.
      // TODO: Revoke or schedule entitlement removal for Cinexium Pro here.
      return;
    }

    default: {
      console.info('Paddle webhook ignored', {
        eventType,
        eventId,
        entityId,
      });
    }
  }
}

export async function POST(req: Request) {
  let webhookSecret: string;

  try {
    webhookSecret = getPaddleWebhookSecret();
  } catch (error) {
    console.error('Paddle webhook secret is not configured.', error);
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('Paddle-Signature');

    if (!verifyPaddleSignature(rawBody, signatureHeader, webhookSecret)) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody) as PaddleWebhookEnvelope;
    await handleKnownEvent(event);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Paddle Webhook Error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}
