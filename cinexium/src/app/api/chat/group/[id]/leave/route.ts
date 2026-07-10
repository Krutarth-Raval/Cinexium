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

    const group = await prisma.groupChat.findUnique({
      where: { id },
      include: { members: true }
    });

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = group.members.find(m => m.userId === user.id);
    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 400 });

    if (member.role === 'ADMIN') {
      const adminCount = group.members.filter(m => m.role === 'ADMIN').length;
      if (adminCount === 1 && group.members.length > 1) {
        return NextResponse.json({ error: 'You are the only admin. Promote someone else before leaving.' }, { status: 400 });
      }
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: id, userId: user.id } }
    });

    // If they were the last member, delete the group entirely
    if (group.members.length === 1) {
      await prisma.groupChat.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Group leave error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
