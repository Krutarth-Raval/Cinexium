import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { applyRateLimit, enforceSameOrigin, generateInviteCode, getClientIp, MAX_GROUP_NAME_LENGTH, normalizeText } from '@/lib/security';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

export async function POST(request: Request) {
  try {
    const originError = enforceSameOrigin(request);
    if (originError) return originError;

    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const user = session.user as { id: string };

    const rateLimit = applyRateLimit({
      key: `group-create:${user.id}:${getClientIp(request)}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many group creation attempts. Please try again later.' }, { status: 429 });
    }

    const formData = await request.formData();
    const name = normalizeText(formData.get('name'), MAX_GROUP_NAME_LENGTH);
    const memberIdsStr = formData.get('memberIds') as string;
    const avatarFile = formData.get('avatar') as File | null;
    const isCommunityStr = formData.get('isCommunity') as string;
    const isPremiumOnlyStr = formData.get('isPremiumOnly') as string;
    
    if (!name || !memberIdsStr) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const parsedMemberIds = JSON.parse(memberIdsStr);
    
    if (!Array.isArray(parsedMemberIds)) {
      return NextResponse.json({ error: 'Invalid memberIds format' }, { status: 400 });
    }

    const memberIds = parsedMemberIds
      .filter((id): id is string => typeof id === 'string' && id.length <= 64)
      .slice(0, 50);

    let avatarUrl = '';
    if (avatarFile && avatarFile.size > 0) {
      if (!avatarFile.type.startsWith('image/') || avatarFile.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: 'Invalid avatar file' }, { status: 400 });
      }

      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      
      const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cinexium/groups' },
          (error, result) => {
            if (error || !result?.secure_url) reject(error ?? new Error('Avatar upload failed'));
            else resolve({ secure_url: result.secure_url });
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

    await syncExpiredSubscriptionForUser(user.id);
    const refreshedUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (isCommunity) {
      if (!refreshedUser.isPremium) {
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

    const inviteCode = isCommunity ? generateInviteCode() : null;

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
