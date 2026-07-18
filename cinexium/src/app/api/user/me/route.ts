import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { FREE_COLLECTION_ITEM_LIMIT, FREE_COLLECTION_LIMIT, getPremiumExpiryWarning, syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

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
  pushNotificationsEnabled?: boolean;
  directMessagePush?: boolean;
  groupMessagePush?: boolean;
  communityMentionPush?: boolean;
  commentReplyPush?: boolean;
  commentLikePush?: boolean;
  groupInvitePush?: boolean;
  communityInvitePush?: boolean;
  followPush?: boolean;
  collectionSharePush?: boolean;
  watchlistReleasePush?: boolean;
  adminAnnouncementPush?: boolean;
};

type UserProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  isPrivate: boolean;
  chatNotifications: boolean;
  appNotifications: boolean;
  pushNotificationsEnabled: boolean;
  directMessagePush: boolean;
  groupMessagePush: boolean;
  communityMentionPush: boolean;
  commentReplyPush: boolean;
  commentLikePush: boolean;
  groupInvitePush: boolean;
  communityInvitePush: boolean;
  followPush: boolean;
  collectionSharePush: boolean;
  watchlistReleasePush: boolean;
  adminAnnouncementPush: boolean;
  isPremium: boolean;
  premiumType: string | null;
  premiumUntil: Date | null;
  themePreference: string;
  country: string | null;
  role: string;
};

function isMissingUserColumnError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
  };

  return (
    candidate.code === 'P2021' ||
    candidate.code === 'P2022' ||
    candidate.message?.includes('column') === true ||
    candidate.message?.includes('Unknown field') === true
  );
}

async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  const fullSelect = {
    id: true,
    name: true,
    username: true,
    email: true,
    bio: true,
    avatar: true,
    isPrivate: true,
    chatNotifications: true,
    appNotifications: true,
    pushNotificationsEnabled: true,
    directMessagePush: true,
    groupMessagePush: true,
    communityMentionPush: true,
    commentReplyPush: true,
    commentLikePush: true,
    groupInvitePush: true,
    communityInvitePush: true,
    followPush: true,
    collectionSharePush: true,
    watchlistReleasePush: true,
    adminAnnouncementPush: true,
    isPremium: true,
    premiumType: true,
    premiumUntil: true,
    themePreference: true,
    country: true,
    role: true,
  } as const;

  try {
    return await prisma.user.findUnique({
      where: { email },
      select: fullSelect,
    });
  } catch (error) {
    if (!isMissingUserColumnError(error)) {
      throw error;
    }

    console.warn('Falling back to legacy user profile select because the database schema is missing one or more profile columns.', error);

    const legacyUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
      },
    });

    if (!legacyUser) {
      return null;
    }

    return {
      ...legacyUser,
      isPrivate: true,
      chatNotifications: true,
      appNotifications: true,
      pushNotificationsEnabled: true,
      directMessagePush: true,
      groupMessagePush: true,
      communityMentionPush: true,
      commentReplyPush: true,
      commentLikePush: true,
      groupInvitePush: true,
      communityInvitePush: true,
      followPush: true,
      collectionSharePush: true,
      watchlistReleasePush: true,
      adminAnnouncementPush: true,
      isPremium: false,
      premiumType: null,
      premiumUntil: null,
      themePreference: 'default',
      country: '',
      role: 'user',
    };
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUserProfileByEmail(session.user.email);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    try {
      await syncExpiredSubscriptionForUser(user.id);
    } catch (error) {
      console.warn('User subscription expiry sync failed during profile fetch.', error);
    }

    const refreshedUser = await getUserProfileByEmail(session.user.email);

    if (!refreshedUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const headersList = await headers();
    const ipCountry = headersList.get('x-vercel-ip-country');
    const premiumWarning = getPremiumExpiryWarning(refreshedUser.premiumUntil, refreshedUser.isPremium);

    return NextResponse.json({ 
      user: {
        ...refreshedUser,
        country: refreshedUser.country || ipCountry || 'US',
        premiumExpiringSoon: premiumWarning.isExpiringSoon,
        premiumExpiresInMs: premiumWarning.expiresInMs,
        premiumWarningWindowHours: 24,
        freeCollectionLimit: FREE_COLLECTION_LIMIT,
        freeCollectionItemLimit: FREE_COLLECTION_ITEM_LIMIT,
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
    if (typeof data.pushNotificationsEnabled === 'boolean') updateData.pushNotificationsEnabled = data.pushNotificationsEnabled;
    if (typeof data.directMessagePush === 'boolean') updateData.directMessagePush = data.directMessagePush;
    if (typeof data.groupMessagePush === 'boolean') updateData.groupMessagePush = data.groupMessagePush;
    if (typeof data.communityMentionPush === 'boolean') updateData.communityMentionPush = data.communityMentionPush;
    if (typeof data.commentReplyPush === 'boolean') updateData.commentReplyPush = data.commentReplyPush;
    if (typeof data.commentLikePush === 'boolean') updateData.commentLikePush = data.commentLikePush;
    if (typeof data.groupInvitePush === 'boolean') updateData.groupInvitePush = data.groupInvitePush;
    if (typeof data.communityInvitePush === 'boolean') updateData.communityInvitePush = data.communityInvitePush;
    if (typeof data.followPush === 'boolean') updateData.followPush = data.followPush;
    if (typeof data.collectionSharePush === 'boolean') updateData.collectionSharePush = data.collectionSharePush;
    if (typeof data.watchlistReleasePush === 'boolean') updateData.watchlistReleasePush = data.watchlistReleasePush;
    if (typeof data.adminAnnouncementPush === 'boolean') updateData.adminAnnouncementPush = data.adminAnnouncementPush;

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
