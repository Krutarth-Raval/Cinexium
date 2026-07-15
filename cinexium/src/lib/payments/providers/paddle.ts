import 'server-only';

import {
  ApiError,
  Environment,
  Paddle,
  type CancelSubscription,
  type CreateTransactionQueryParameters,
  type CreateTransactionRequestBody,
  type GetSubscriptionQueryParameters,
  type GetTransactionQueryParameters,
  type Subscription,
  type Transaction,
} from '@paddle/paddle-node-sdk';

import {
  getPaddleApiKey,
  getPaddleEnvironment,
  type PaddleRuntimeEnvironment,
} from '@/lib/payments/paddle-config';

export type CreatePaddleCheckoutInput = CreateTransactionRequestBody;

export type CreatePaddleCheckoutResult = {
  provider: 'paddle';
  environment: PaddleRuntimeEnvironment;
  transactionId: string;
  checkoutUrl: string | null;
  subscriptionId: string | null;
  transaction: Transaction;
};

function logPaddleRequest(action: string, details: Record<string, unknown>) {
  console.info('Paddle request', {
    action,
    environment: getPaddleEnvironment(),
    ...details,
  });
}

function logPaddleResponse(action: string, details: Record<string, unknown>) {
  console.info('Paddle response', {
    action,
    environment: getPaddleEnvironment(),
    ...details,
  });
}

function getPaddleSdkEnvironment() {
  return getPaddleEnvironment() === 'live' ? Environment.production : Environment.sandbox;
}

function createPaddleClient() {
  return new Paddle(getPaddleApiKey(), {
    environment: getPaddleSdkEnvironment(),
  });
}

function toProviderError(action: string, error: unknown): Error {
  if (error instanceof ApiError) {
    return new Error(`Paddle ${action} failed: ${error.detail || error.code}`);
  }

  if (error instanceof Error) {
    return new Error(`Paddle ${action} failed: ${error.message}`);
  }

  return new Error(`Paddle ${action} failed.`);
}

export async function createCheckout(
  input: CreatePaddleCheckoutInput,
  queryParams?: CreateTransactionQueryParameters
): Promise<CreatePaddleCheckoutResult> {
  try {
    const transactionInput: CreatePaddleCheckoutInput = input;

    logPaddleRequest('transactions.create', {
      transactionInput,
      include: queryParams?.include ?? [],
    });

    const paddle = createPaddleClient();
    const transaction = await paddle.transactions.create(transactionInput, queryParams);

    logPaddleResponse('transactions.create', {
      transactionId: transaction.id,
      status: transaction.status,
      checkoutUrl: transaction.checkout?.url ?? null,
      subscriptionId: transaction.subscriptionId,
      customerId: transaction.customerId,
    });

    return {
      provider: 'paddle',
      environment: getPaddleEnvironment(),
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url ?? null,
      subscriptionId: transaction.subscriptionId,
      transaction,
    };
  } catch (error) {
    throw toProviderError('checkout creation', error);
  }
}

export async function getTransaction(
  transactionId: string,
  queryParams?: GetTransactionQueryParameters
): Promise<Transaction> {
  try {
    logPaddleRequest('transactions.get', {
      transactionId,
      include: queryParams?.include ?? [],
    });

    const paddle = createPaddleClient();
    const transaction = await paddle.transactions.get(transactionId, queryParams);

    logPaddleResponse('transactions.get', {
      transactionId: transaction.id,
      status: transaction.status,
      subscriptionId: transaction.subscriptionId,
      customerId: transaction.customerId,
      customData: transaction.customData ?? null,
    });

    return transaction;
  } catch (error) {
    throw toProviderError(`transaction lookup for ${transactionId}`, error);
  }
}

export async function getSubscription(
  subscriptionId: string,
  queryParams?: GetSubscriptionQueryParameters
): Promise<Subscription> {
  try {
    logPaddleRequest('subscriptions.get', {
      subscriptionId,
      include: queryParams?.include ?? [],
    });

    const paddle = createPaddleClient();
    const subscription = await paddle.subscriptions.get(subscriptionId, queryParams);

    logPaddleResponse('subscriptions.get', {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: subscription.customerId,
      nextBilledAt: subscription.nextBilledAt,
      canceledAt: subscription.canceledAt,
    });

    return subscription;
  } catch (error) {
    throw toProviderError(`subscription lookup for ${subscriptionId}`, error);
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  requestBody?: CancelSubscription
): Promise<Subscription> {
  try {
    logPaddleRequest('subscriptions.cancel', {
      subscriptionId,
      effectiveFrom: requestBody?.effectiveFrom ?? null,
    });

    const paddle = createPaddleClient();
    const subscription = await paddle.subscriptions.cancel(subscriptionId, requestBody);

    logPaddleResponse('subscriptions.cancel', {
      subscriptionId: subscription.id,
      status: subscription.status,
      scheduledChange: subscription.scheduledChange ?? null,
      canceledAt: subscription.canceledAt,
    });

    return subscription;
  } catch (error) {
    throw toProviderError(`subscription cancellation for ${subscriptionId}`, error);
  }
}
