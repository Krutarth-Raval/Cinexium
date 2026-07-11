import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as any;

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const memberIdsStr = formData.get('memberIds') as string;
    const avatarFile = formData.get('avatar') as File | null;
    
    if (!name || !memberIdsStr) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const memberIds = JSON.parse(memberIdsStr);
    
    if (!Array.isArray(memberIds)) {
      return NextResponse.json({ error: 'Invalid memberIds format' }, { status: 400 });
    }

    let avatarUrl = '';
    if (avatarFile && avatarFile.size > 0) {
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cinexium/groups' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
      
      avatarUrl = uploadResult.secure_url;
    }

    // Add creator to members
    const allMembers = Array.from(new Set([...memberIds, user.id]));

    if (allMembers.length < 2) {
      return NextResponse.json({ error: 'Group needs at least 2 members' }, { status: 400 });
    }

    const group = await prisma.groupChat.create({
      data: {
        name,
        avatar: avatarUrl,
        ownerId: user.id,
        members: {
          create: allMembers.map(id => ({
            userId: id as string,
            role: id === user.id ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, name: true, avatar: true } } }
        }
      }
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error('Group create error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
