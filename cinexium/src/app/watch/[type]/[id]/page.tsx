import { tmdb } from '@/lib/tmdb';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import WatchClient from './WatchClient';

export async function generateMetadata({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const details = await tmdb.getFullMediaDetails(type as any, id);
  if (!details) return { title: 'Not Found' };
  return { title: `Watch ${details.title || details.name} - Cinexium` };
}

export default async function WatchPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;

  if (type !== 'movie' && type !== 'tv' && type !== 'series') {
    return notFound();
  }

  const normalizedType = type === 'series' ? 'tv' : (type as 'movie' | 'tv');

  const details = await tmdb.getFullMediaDetails(normalizedType, id);
  if (!details) {
    return notFound();
  }

  const cookieStore = await cookies();
  const regionCookie = cookieStore.get('cinexium_region');
  const region = regionCookie?.value || 'hollywood';

  // Check Premium Access
  const session = await getServerSession(authOptions);
  let isPremium = false;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { isPremium: true, premiumUntil: true }
    });
    if (user?.isPremium) {
      const premiumEndsAt = user.premiumUntil ? new Date(user.premiumUntil) : null;
      if (!premiumEndsAt || premiumEndsAt.getTime() > Date.now()) {
        isPremium = true;
      }
    }
  }

  if (!isPremium) {
    redirect('/premium');
  }

  return (
    <WatchClient
      mediaId={id}
      mediaType={normalizedType}
      title={details.title || details.name}
      seasons={details.seasons}
      region={region}
    />
  );
}
