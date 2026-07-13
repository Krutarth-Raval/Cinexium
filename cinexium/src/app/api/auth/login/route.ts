import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { applyRateLimit, AUTH_ERROR_MESSAGE, enforceSameOrigin, getClientIp, normalizeIdentifier, normalizeText } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.JWT_SECRET) {
      return NextResponse.json({ message: 'Authentication is not configured' }, { status: 500 });
    }

    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const clientIp = getClientIp(req);
    const rateLimit = applyRateLimit({
      key: `login:${clientIp}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const identifier = normalizeIdentifier(body.identifier, 254);
    const password = normalizeText(body.password, 128);

    if (!identifier || !password) {
      return NextResponse.json({ message: 'Username/email and password are required' }, { status: 400 });
    }

    // Find user by email OR username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    const isPasswordMatch = user ? await bcrypt.compare(password, user.password || "") : false;

    if (!user || !isPasswordMatch) {
      return NextResponse.json({ message: AUTH_ERROR_MESSAGE }, { status: 401 });
    }

    // Cancel account deletion if login again
    if (user.deleteRequested) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          deleteRequested: false,
          deleteAt: null,
        }
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: '7d',
      }
    );

    // Response
    return NextResponse.json(
      {
        message: 'Login Successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
