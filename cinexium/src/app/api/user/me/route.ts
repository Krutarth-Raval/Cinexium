import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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
      // Process file upload locally
      const buffer = Buffer.from(await avatarFile.arrayBuffer());
      const filename = `${session.user.email.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}${path.extname(avatarFile.name)}`;
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      avatarUrl = `/uploads/avatars/${filename}`;
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
