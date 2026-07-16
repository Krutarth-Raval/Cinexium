import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AvatarUploadResult = {
  secure_url: string;
};

type UserSettingsPatch = {
  isPrivate?: boolean;
  chatNotifications?: boolean;
  appNotifications?: boolean;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const select = {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatar: true,
      isPrivate: true,
      chatNotifications: true,
      appNotifications: true,
      isPremium: true,
      premiumType: true,
      premiumUntil: true,
      themePreference: true,
      country: true,
      role: true,
    } as const;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select,
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    try {
      await syncExpiredSubscriptionForUser(user.id);
    } catch (error) {
      console.warn('User subscription expiry sync failed during profile fetch.', error);
    }

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select,
    });

    if (!refreshedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const headersList = await headers();
    const ipCountry = headersList.get('x-vercel-ip-country');

    return NextResponse.json({ 
      user: {
        ...refreshedUser,
        country: refreshedUser.country || ipCountry || 'US'
      }
    });
  } catch (error) {
    console.error('User profile GET error:', error);
    return NextResponse.json({ error: 'Failed to load user profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const bio = formData.get('bio') as string;
    const avatarFile = formData.get('avatar') as File | null;
    let avatarUrl = formData.get('avatarUrl') as string | null;

    if (avatarFile && avatarFile.size > 0) {
      const { default: cloudinary } = await import('@/lib/cloudinary');
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      
      const uploadResult = await new Promise<AvatarUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cinexium/avatars' },
          (error, result) => {
            if (error) reject(error);
            else if (result?.secure_url) resolve({ secure_url: result.secure_url });
            else reject(new Error('Avatar upload failed'));
          }
        );
        uploadStream.end(buffer);
      });
      
      avatarUrl = uploadResult.secure_url;
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        username,
        bio,
        ...(avatarUrl !== null && { avatar: avatarUrl }),
      }
    });

    if (user && user.username !== username) {
      const { sendEmail } = await import('@/lib/email');
      await sendEmail(
        session.user.email,
        'Username Changed - Cinexium',
        `<h2 style="color: #e50914;">Hello ${name}</h2>
        <p>Your Cinexium username was recently changed from <strong>@${user.username}</strong> to <strong>@${username}</strong>.</p>
        <p>If you did not make this change, please secure your account immediately.</p>`
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = (await request.json()) as UserSettingsPatch;
    const updateData: UserSettingsPatch = {};
    
    if (typeof data.isPrivate === 'boolean') updateData.isPrivate = data.isPrivate;
    if (typeof data.chatNotifications === 'boolean') updateData.chatNotifications = data.chatNotifications;
    if (typeof data.appNotifications === 'boolean') updateData.appNotifications = data.appNotifications;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Settings patch error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
