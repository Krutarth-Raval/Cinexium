import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mediaId } = await params;
    const body = await req.json();
    const { type } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const share = await prisma.mediaShare.create({
      data: {
        userId: user.id,
        mediaId,
        mediaType: type || 'movie'
      }
    });

    return NextResponse.json(share);
  } catch (error) {
    console.error('Error sharing media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
