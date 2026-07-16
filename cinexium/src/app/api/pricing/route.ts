import { NextResponse } from 'next/server';

import { getPricingForRequest } from '@/lib/pricing';

export async function GET() {
  try {
    const pricing = await getPricingForRequest();
    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Pricing API Error:', error);
    return NextResponse.json({ error: 'Failed to load pricing' }, { status: 500 });
  }
}
