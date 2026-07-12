'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function trackHistoryAction(mediaId: string, mediaType: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return { error: 'Unauthorized' };
    }

    if (!mediaId || !mediaType) {
      return { error: 'Missing parameters' };
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return { error: 'User not found' };
    }

    // Remove any existing history for this media and user
    await prisma.history.deleteMany({
      where: {
        userId: user.id,
        mediaId: mediaId.toString(),
        mediaType: mediaType
      }
    });
    
    // Add new history entry
    await prisma.history.create({
      data: {
        userId: user.id,
        mediaId: mediaId.toString(),
        mediaType: mediaType
      }
    });

    // Revalidate the home page so the history carousel updates immediately
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error tracking history:', error);
    return { error: 'Internal Server Error' };
  }
}
