import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  return NextResponse.json({ authenticated: Boolean(session), profile: session?.profile || null });
}
