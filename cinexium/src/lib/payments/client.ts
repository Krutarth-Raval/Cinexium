'use client';

import { CheckoutEventNames, type PaddleEventData, initializePaddle } from '@paddle/paddle-js';

import { getPaddleClientToken } from '@/lib/payments/paddle-config';
import type { PaymentSessionResponse, PremiumPlan } from '@/lib/payments/types';

type CheckoutResult =
  | { success: true }
  | { success: false; status: 'cancelled' | 'error' | 'unauthorized'; message: string };

type ActiveCheckoutHandlers = {
  onComplete: (transactionId: string) => void;
  onCancel: () => void;
  onError: (message: string) => void;
};

let paddlePromise: ReturnType<typeof initializePaddle> | null = null;
let activeCheckoutHandlers: ActiveCheckoutHandlers | null = null;

function getPaddleToken() {
  return getPaddleClientToken();
}

function handlePaddleEvent(event: PaddleEventData) {
  if (!activeCheckoutHandlers || !event.name) {
    return;
  }

  switch (event.name) {
    case CheckoutEventNames.CHECKOUT_COMPLETED: {
      const transactionId = event.data?.transaction_id;

      if (transactionId) {
        activeCheckoutHandlers.onComplete(transactionId);
      } else {
        activeCheckoutHandlers.onError('Paddle checkout completed without a transaction ID.');
      }

      activeCheckoutHandlers = null;
      return;
    }

    case CheckoutEventNames.CHECKOUT_CLOSED: {
      activeCheckoutHandlers.onCancel();
      activeCheckoutHandlers = null;
      return;
    }

    case CheckoutEventNames.CHECKOUT_ERROR:
    case CheckoutEventNames.CHECKOUT_FAILED:
    case CheckoutEventNames.CHECKOUT_PAYMENT_ERROR:
    case CheckoutEventNames.CHECKOUT_PAYMENT_FAILED: {
      activeCheckoutHandlers.onError(event.detail || 'Paddle checkout failed.');
      activeCheckoutHandlers = null;
      return;
    }

    default:
      return;
  }
}

async function createPaymentSession(plan: PremiumPlan): Promise<PaymentSessionResponse> {
  const response = await fetch('/api/payment/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    throw new Error(data.error || 'Failed to create payment session.');
  }

  return data;
}

async function verifyPayment(orderId: string): Promise<void> {
  const response = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Payment verification failed.');
  }
}

async function getPaddleInstance(session: PaymentSessionResponse) {
  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      environment: session.environment,
      token: getPaddleToken(),
      checkout: {
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          variant: 'one-page',
        },
      },
      eventCallback: handlePaddleEvent,
    });
  }

  return paddlePromise;
}

async function runPaddleCheckout(session: PaymentSessionResponse): Promise<{ transactionId: string }> {
  if (!session.transactionId) {
    throw new Error('Paddle transaction ID is missing.');
  }

  const transactionId = session.transactionId;
  const paddle = await getPaddleInstance(session);
  if (!paddle) {
    throw new Error('Failed to initialize Paddle checkout.');
  }

  return await new Promise<{ transactionId: string }>((resolve, reject) => {
    activeCheckoutHandlers = {
      onComplete: (transactionId) => resolve({ transactionId }),
      onCancel: () => reject(new Error('PADDLE_CHECKOUT_CANCELLED')),
      onError: (message) => reject(new Error(message)),
    };

    paddle.Checkout.open({
      transactionId,
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        variant: 'one-page',
      },
    });
  });
}

export async function beginPremiumCheckout(plan: PremiumPlan): Promise<CheckoutResult> {
  try {
    const session = await createPaymentSession(plan);
    const checkoutResult = await runPaddleCheckout(session);
    await verifyPayment(checkoutResult.transactionId);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return {
        success: false,
        status: 'unauthorized',
        message: 'Unauthorized',
      };
    }

    if (error instanceof Error && error.message === 'PADDLE_CHECKOUT_CANCELLED') {
      return {
        success: false,
        status: 'cancelled',
        message: 'Payment was cancelled or failed.',
      };
    }

    return {
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to initiate payment.',
    };
  }
}
