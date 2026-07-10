import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const avatarFile = formData.get('avatar') as File | null;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let avatarUrl = undefined;
    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const filename = `group_${Date.now()}_${Math.random().toString(36).substring(7)}${path.extname(avatarFile.name)}`;
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'groups');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      avatarUrl = `/uploads/groups/${filename}`;
    }

    const updatedGroup = await prisma.groupChat.update({
      where: { id },
      data: {
        name,
        ...(avatarUrl !== undefined && { avatar: avatarUrl })
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } }
        }
      }
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error('Group update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
