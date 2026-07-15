import 'server-only';

import { headers } from 'next/headers';

import type { PricingResponse } from '@/lib/payments/types';

const INDIA_PRICING: Omit<PricingResponse, 'billingCountry'> = {
  currency: 'INR',
  symbol: '\u20B9',
  monthly: 199,
  yearly: 1999,
};

const INTERNATIONAL_PRICING: Omit<PricingResponse, 'billingCountry'> = {
  currency: 'USD',
  symbol: '$',
  monthly: 2.49,
  yearly: 24.99,
};

export function normalizeBillingCountry(country: string | null | undefined) {
  if (!country) {
    return 'US';
  }

  const normalized = country.trim().toUpperCase();

  if (normalized === 'INDIA' || normalized === 'IN') {
    return 'IN';
  }

  if (/^[A-Z]{2}$/.test(normalized)) {
    return normalized;
  }

  return 'US';
}

export function getPricingForCountry(country: string | null | undefined): PricingResponse {
  const billingCountry = normalizeBillingCountry(country);
  const pricing = billingCountry === 'IN' ? INDIA_PRICING : INTERNATIONAL_PRICING;

  return {
    ...pricing,
    billingCountry,
  };
}

export function getPricingAmount(pricing: PricingResponse, plan: 'monthly' | 'yearly') {
  return plan === 'yearly' ? pricing.yearly : pricing.monthly;
}

export async function resolveBillingCountry(preferredCountry?: string | null) {
  if (preferredCountry) {
    return normalizeBillingCountry(preferredCountry);
  }

  const requestHeaders = await headers();
  return normalizeBillingCountry(requestHeaders.get('x-vercel-ip-country'));
}

export async function getPricingForRequest(preferredCountry?: string | null): Promise<PricingResponse> {
  const billingCountry = await resolveBillingCountry(preferredCountry);
  return getPricingForCountry(billingCountry);
}
