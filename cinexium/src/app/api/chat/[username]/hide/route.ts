import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { user1Id: user.id, user2Id: targetUser.id },
          { user1Id: targetUser.id, user2Id: user.id }
        ]
      }
    });

    if (!conversation) {
      // Create conversation if it doesn't exist
      conversation = await prisma.conversation.create({
        data: {
          user1Id: user.id,
          user2Id: targetUser.id
        }
      });
    }

    const body = await req.json();
    const { isHidden } = body;
    const isUser1 = conversation.user1Id === user.id;

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: isUser1 ? { isHiddenByUser1: isHidden } : { isHiddenByUser2: isHidden }
    });

    return NextResponse.json({ success: true, isHidden });
  } catch (error: any) {
    console.error('Hide Chat Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
