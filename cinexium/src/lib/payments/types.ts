export type PremiumPlan = 'monthly' | 'yearly';

export type PricingResponse = {
  currency: 'INR' | 'USD';
  symbol: '\u20B9' | '$';
  monthly: number;
  yearly: number;
  billingCountry: string;
};

export type PaymentSessionResponse = {
  provider: 'paddle';
  orderId: string;
  paymentSessionId: string;
  environment: 'sandbox' | 'production';
  billingCountry: string;
  currency: PricingResponse['currency'];
  checkoutUrl?: string | null;
  transactionId?: string;
  subscriptionId?: string | null;
};
