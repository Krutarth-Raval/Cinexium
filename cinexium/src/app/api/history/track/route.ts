import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { mediaId, mediaType } = body;

    if (!mediaId || !mediaType) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
