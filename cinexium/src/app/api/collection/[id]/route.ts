import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { syncExpiredSubscriptionForUser } from '@/lib/subscriptions';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await syncExpiredSubscriptionForUser(user.id);

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    if (collection.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const isPublic = formData.get('isPublic') === 'true';
    const thumbnailFile = formData.get('thumbnail') as File | null;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check unique constraint per user if name changed
    if (name !== collection.name) {
      const existing = await prisma.collection.findUnique({
        where: {
          userId_name: {
            userId: user.id,
            name: name
          }
        }
      });
      if (existing) {
        return NextResponse.json({ error: 'You already have a collection with this name' }, { status: 400 });
      }
    }

    let thumbnailUrl = collection.thumbnail;

    if (thumbnailFile && thumbnailFile.size > 0) {
      const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
      
      const uploadResult: { secure_url: string } = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cinexium/collections' },
          (error, result) => {
            if (error) reject(error);
            else if (result?.secure_url) resolve(result);
            else reject(new Error('Collection thumbnail upload failed'));
          }
        );
        uploadStream.end(buffer);
      });
      
      thumbnailUrl = uploadResult.secure_url;
    }

    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: {
        name,
        description: description || '',
        isPublic,
        thumbnail: thumbnailUrl
      }
    });

    return NextResponse.json({ success: true, collection: updatedCollection });
  } catch (error: unknown) {
    console.error('Error updating collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await syncExpiredSubscriptionForUser(user.id);
    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!refreshedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection || collection.userId !== refreshedUser.id) {
      return NextResponse.json({ error: 'Not found or Forbidden' }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === 'pin' || action === 'unpin') {
      if (!refreshedUser.isPremium) {
        return NextResponse.json({ error: 'Pro membership required to pin collections.', premiumRequired: true }, { status: 403 });
      }

      const updated = await prisma.collection.update({
        where: { id },
        data: { isPinned: action === 'pin' }
      });

      return NextResponse.json({ success: true, isPinned: updated.isPinned });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error patching collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await syncExpiredSubscriptionForUser(user.id);

    const collection = await prisma.collection.findUnique({
      where: { id }
    });

    if (!collection || collection.userId !== user.id) {
      return NextResponse.json({ error: 'Not found or Forbidden' }, { status: 403 });
    }

    await prisma.collection.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
