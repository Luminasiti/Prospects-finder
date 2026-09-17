import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const VALID_EMAIL = process.env.AUTH_EMAIL || 'accounts@luminasiti.com';
const VALID_PASSWORD = process.env.AUTH_PASSWORD || 'LuminaAudit#2026!';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (
      email.trim().toLowerCase() !== VALID_EMAIL.toLowerCase() ||
      password !== VALID_PASSWORD
    ) {
      return NextResponse.json(
        { error: 'Invalid credentials. Access restricted to authorized accounts.' },
        { status: 401 }
      );
    }

    // Create session token
    const token = Buffer.from(
      JSON.stringify({
        email: VALID_EMAIL,
        loggedInAt: Date.now(),
        sig: crypto.createHmac('sha256', 'luminasiti_secret_2026').update(VALID_EMAIL).digest('hex'),
      })
    ).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: { email: VALID_EMAIL },
    });

    // Set secure httpOnly session cookie
    response.cookies.set('prospectpulse_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
