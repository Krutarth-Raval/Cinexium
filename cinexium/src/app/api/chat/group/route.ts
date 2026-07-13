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
    const isCommunityStr = formData.get('isCommunity') as string;
    const isPremiumOnlyStr = formData.get('isPremiumOnly') as string;
    
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

    const isCommunity = isCommunityStr === 'true';
    const isPremiumOnly = isPremiumOnlyStr === 'true';

    if (isCommunity) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser?.isPremium) {
        return NextResponse.json({ error: 'Only Pro users can create Communities.' }, { status: 403 });
      }
    }

    if (isPremiumOnly) {
      const premiumUsers = await prisma.user.findMany({
        where: { id: { in: memberIds }, isPremium: true }
      });
      if (premiumUsers.length !== memberIds.length) {
         return NextResponse.json({ error: 'All added members must be Pro users to join a premium-only community.' }, { status: 400 });
      }
    }

    const inviteCode = isCommunity ? Math.random().toString(36).substring(2, 10) + Date.now().toString(36) : null;

    const group = await prisma.groupChat.create({
      data: {
        name,
        avatar: avatarUrl,
        ownerId: user.id,
        isCommunity,
        isPremiumOnly,
        inviteCode,
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
