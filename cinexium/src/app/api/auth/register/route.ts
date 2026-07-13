import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { isValidEmail, isValidPassword, isValidUsername } from '@/lib/validators';
import { applyRateLimit, enforceSameOrigin, getClientIp, normalizeIdentifier, normalizeText } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const originError = enforceSameOrigin(req);
    if (originError) return originError;

    const clientIp = getClientIp(req);
    const rateLimit = applyRateLimit({
      key: `register:${clientIp}`,
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ message: 'Too many registration attempts. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const name = normalizeText(body.name, 80);
    const username = normalizeIdentifier(body.username, 24);
    const email = normalizeIdentifier(body.email, 254);
    const password = normalizeText(body.password, 128);

    if (!name || !username || !email || !password) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ message: 'Invalid email format' }, { status: 400 });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { message: 'Username can only contain lowercase letters, numbers, underscores and dots' },
        { status: 400 }
      );
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { message: 'Password must be 8-128 characters long and include uppercase, lowercase, and a number' },
        { status: 400 }
      );
    }

    // Check existing email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
    }

    // Check existing username
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
      }
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
