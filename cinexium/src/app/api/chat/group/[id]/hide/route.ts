import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: user.id } }
    });

    if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 });

    const body = await req.json();
    const { isHidden } = body;

    await prisma.groupMember.update({
      where: { id: member.id },
      data: { isHidden }
    });

    return NextResponse.json({ success: true, isHidden });
  } catch (error: any) {
    console.error('Hide Group Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
