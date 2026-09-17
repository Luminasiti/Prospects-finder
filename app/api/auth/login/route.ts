import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  let str = val.trim();
  // Strip enclosing quotes if user pasted with quotes into Vercel
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }
  return str;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const inputEmail = String(email).trim().toLowerCase();
    const inputPassword = String(password).trim();

    // Collect valid emails (from env or default)
    const envEmails = [
      cleanEnv(process.env.AUTH_EMAIL),
      cleanEnv(process.env.ADMIN_EMAIL),
      'accounts@luminasiti.com',
    ].filter(Boolean).map(e => e.toLowerCase());

    // Collect valid passwords (from env or default)
    const envPasswords = [
      cleanEnv(process.env.AUTH_PASSWORD),
      cleanEnv(process.env.ADMIN_PASSWORD),
      'LuminaAudit#2026!',
    ].filter(Boolean);

    const isEmailValid = envEmails.includes(inputEmail);
    const isPasswordValid = envPasswords.some(
      (validPw) => inputPassword === validPw || inputPassword === validPw.replace(/["']/g, '')
    );

    if (!isEmailValid || !isPasswordValid) {
      console.warn(`[Auth Failed] Attempt for email: "${inputEmail}". Email match: ${isEmailValid}, Password match: ${isPasswordValid}`);
      return NextResponse.json(
        { error: 'Invalid credentials. Access restricted to authorized accounts.' },
        { status: 401 }
      );
    }

    const authorizedEmail = inputEmail;

    // Create session token
    const token = Buffer.from(
      JSON.stringify({
        email: authorizedEmail,
        loggedInAt: Date.now(),
        sig: crypto.createHmac('sha256', 'luminasiti_secret_2026').update(authorizedEmail).digest('hex'),
      })
    ).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: { email: authorizedEmail },
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
