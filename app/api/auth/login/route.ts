import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth-cookies';
import { portalForRole, sessionFromToken } from '@/lib/auth-server';
import type { UserRole } from '@/lib/auth-types';
import { authConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase-config';

export async function POST(request: NextRequest) {
  if (!authConfigured()) return NextResponse.json({ error: 'A Supabase Auth még nincs beállítva.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const expectedRole = body.expectedRole ? String(body.expectedRole).toUpperCase() as UserRole : null;
  if (!email || !password) return NextResponse.json({ error: 'Add meg az e-mail-címet és a jelszót.' }, { status: 400 });

  const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: supabasePublishableKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: data.error_description || data.msg || 'Hibás e-mail-cím vagy jelszó.' }, { status: 401 });

  const session = await sessionFromToken(data.access_token);
  if (!session) return NextResponse.json({ error: 'A profil nem található. Futtasd le a Supabase SQL telepítőt.' }, { status: 500 });
  if (expectedRole && session.profile.role !== expectedRole) {
    return NextResponse.json({ error: `Ez a fiók nem ${expectedRole === 'ADMIN' ? 'admin' : expectedRole === 'MANUFACTURER' ? 'beszállítói' : 'vevői'} fiók.` }, { status: 403 });
  }
  if (session.profile.status === 'SUSPENDED') return NextResponse.json({ error: 'A fiók fel van függesztve.' }, { status: 403 });

  const result = NextResponse.json({ ok: true, role: session.profile.role, redirectTo: portalForRole(session.profile.role) });
  applyAuthCookies(result, data);
  return result;
}
