import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, clearAuthCookies } from '@/lib/auth-cookies';
import { supabasePublishableKey, supabaseUrl } from '@/lib/supabase-config';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (token && supabaseUrl()) {
    await fetch(`${supabaseUrl()}/auth/v1/logout`, {
      method: 'POST',
      headers: { apikey: supabasePublishableKey(), Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }).catch(() => null);
  }
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
