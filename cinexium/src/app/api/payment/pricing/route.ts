import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { getPricingForRequest } from '@/lib/payments/pricing';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;

    let country: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { country: true },
      });

      country = user?.country ?? null;
    }

    const pricing = await getPricingForRequest(country);
    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Pricing Error:', error);
    return NextResponse.json({ error: 'Failed to load pricing' }, { status: 500 });
  }
}
