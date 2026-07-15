export type PaddleRuntimeEnvironment = 'sandbox' | 'live';

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getPaddleEnvironment(): PaddleRuntimeEnvironment {
  const environment = process.env.PADDLE_ENV;

  if (environment === 'sandbox' || environment === 'live') {
    return environment;
  }

  throw new Error('PADDLE_ENV must be set to "sandbox" or "live".');
}

export function getPaddleApiKey() {
  return getPaddleEnvironment() === 'live'
    ? requireEnv('PADDLE_API_KEY', process.env.PADDLE_API_KEY)
    : requireEnv('PADDLE_SANDBOX_API_KEY', process.env.PADDLE_SANDBOX_API_KEY);
}

export function getPaddleWebhookSecret() {
  return getPaddleEnvironment() === 'live'
    ? requireEnv('PADDLE_WEBHOOK_SECRET', process.env.PADDLE_WEBHOOK_SECRET)
    : requireEnv('PADDLE_SANDBOX_WEBHOOK_SECRET', process.env.PADDLE_SANDBOX_WEBHOOK_SECRET);
}

export function getPaddleClientToken() {
  return getPaddleEnvironment() === 'live'
    ? requireEnv('NEXT_PUBLIC_PADDLE_CLIENT_SIDE_TOKEN', process.env.NEXT_PUBLIC_PADDLE_CLIENT_SIDE_TOKEN)
    : requireEnv(
        'NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN',
        process.env.NEXT_PUBLIC_PADDLE_SANDBOX_CLIENT_TOKEN
      );
}

export function getPaddlePriceId(currency: 'INR' | 'USD', billingCycle: 'monthly' | 'yearly') {
  if (getPaddleEnvironment() === 'live') {
    if (currency === 'INR') {
      return billingCycle === 'yearly'
        ? requireEnv('PADDLE_PRICE_ID_INR_YEARLY', process.env.PADDLE_PRICE_ID_INR_YEARLY)
        : requireEnv('PADDLE_PRICE_ID_INR_MONTHLY', process.env.PADDLE_PRICE_ID_INR_MONTHLY);
    }

    return billingCycle === 'yearly'
      ? requireEnv('PADDLE_PRICE_ID_USD_YEARLY', process.env.PADDLE_PRICE_ID_USD_YEARLY)
      : requireEnv('PADDLE_PRICE_ID_USD_MONTHLY', process.env.PADDLE_PRICE_ID_USD_MONTHLY);
  }

  if (currency === 'INR') {
    return billingCycle === 'yearly'
      ? requireEnv('PADDLE_SANDBOX_PRICE_ID_INR_YEARLY', process.env.PADDLE_SANDBOX_PRICE_ID_INR_YEARLY)
      : requireEnv('PADDLE_SANDBOX_PRICE_ID_INR_MONTHLY', process.env.PADDLE_SANDBOX_PRICE_ID_INR_MONTHLY);
  }

  return billingCycle === 'yearly'
    ? requireEnv('PADDLE_SANDBOX_PRICE_ID_USD_YEARLY', process.env.PADDLE_SANDBOX_PRICE_ID_USD_YEARLY)
    : requireEnv('PADDLE_SANDBOX_PRICE_ID_USD_MONTHLY', process.env.PADDLE_SANDBOX_PRICE_ID_USD_MONTHLY);
}

export function getPaddleCheckoutEnvironment(): 'sandbox' | 'production' {
  return getPaddleEnvironment() === 'live' ? 'production' : 'sandbox';
}
