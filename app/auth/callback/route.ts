import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth-cookies';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase-config';

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') || 'email';
  if (!tokenHash) return NextResponse.redirect(new URL('/buyer/login?error=missing-token', request.url));
  const verify = await fetch(`${supabaseUrl()}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: supabasePublishableKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ token_hash: tokenHash, type }),
    cache: 'no-store',
  });
  const data = await verify.json().catch(() => ({}));
  if (!verify.ok || !data.access_token) return NextResponse.redirect(new URL('/buyer/login?error=verification-failed', request.url));
  const response = NextResponse.redirect(new URL('/buyer', request.url));
  applyAuthCookies(response, data);
  return response;
}
