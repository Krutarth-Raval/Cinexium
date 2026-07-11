import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatar: true,
      isPrivate: true,
      chatNotifications: true,
      appNotifications: true,
    }
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
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
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cinexium/avatars' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
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
    const data = await request.json();
    const updateData: any = {};
    
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
