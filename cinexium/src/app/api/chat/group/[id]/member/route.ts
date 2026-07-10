import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    // Verify user is an admin of this group
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: user.id } }
    });

    if (!membership || membership.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
    }

    const { targetUserId, action } = await request.json();

    if (!targetUserId || !action) {
      return NextResponse.json({ error: 'Missing targetUserId or action' }, { status: 400 });
    }

    if (action === 'promote') {
      await prisma.groupMember.update({
        where: { groupId_userId: { groupId: id, userId: targetUserId } },
        data: { role: 'ADMIN' }
      });
    } else if (action === 'kick') {
      await prisma.groupMember.delete({
        where: { groupId_userId: { groupId: id, userId: targetUserId } }
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Return the updated group
    const updatedGroup = await prisma.groupChat.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } },
          orderBy: { role: 'asc' }
        }
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Group member error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
