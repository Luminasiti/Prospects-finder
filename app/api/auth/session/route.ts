import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('prospectpulse_session')?.value;

    if (!cookie) {
      return NextResponse.json({ authenticated: false });
    }

    const decoded = JSON.parse(Buffer.from(cookie, 'base64').toString('utf8'));
    const expectedSig = crypto.createHmac('sha256', 'luminasiti_secret_2026').update(decoded.email).digest('hex');

    if (decoded.sig !== expectedSig) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      email: decoded.email,
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false });
  }
}
