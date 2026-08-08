import { NextRequest, NextResponse } from 'next/server';
import { applyAuthCookies } from '@/lib/auth-cookies';
import type { UserRole } from '@/lib/auth-types';
import { authConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase-config';
import { getPlatformSettings } from '@/lib/platform-settings';

const PUBLIC_ROLES: UserRole[] = ['BUYER', 'MANUFACTURER'];

export async function POST(request: NextRequest) {
  const platformSettings = await getPlatformSettings();
  if (!platformSettings.registrations_enabled) return NextResponse.json({ error: 'Az új regisztráció jelenleg szünetel.' }, { status: 503 });
  if (!authConfigured()) return NextResponse.json({ error: 'A Supabase Auth még nincs beállítva.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const role = String(body.role || '').toUpperCase() as UserRole;
  if (!PUBLIC_ROLES.includes(role)) return NextResponse.json({ error: 'Érvénytelen fióktípus.' }, { status: 400 });
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const fullName = String(body.fullName || '').trim();
  const companyName = String(body.companyName || '').trim();
  if (!email || !password || password.length < 8 || !fullName || !companyName) {
    return NextResponse.json({ error: 'Tölts ki minden kötelező mezőt. A jelszó legalább 8 karakter legyen.' }, { status: 400 });
  }

  const response = await fetch(`${supabaseUrl()}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: supabasePublishableKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      data: {
        role,
        full_name: fullName,
        company_name: companyName,
        phone: String(body.phone || '').trim(),
        country: String(body.country || '').trim(),
        website: String(body.website || '').trim(),
        supplier_type: ['MANUFACTURER','WHOLESALER','BOTH'].includes(String(body.supplierType || '').toUpperCase()) ? String(body.supplierType).toUpperCase() : 'MANUFACTURER',
      },
    }),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: data.msg || data.message || 'A regisztráció sikertelen.' }, { status: response.status });

  const result = NextResponse.json({
    ok: true,
    role,
    needsEmailConfirmation: !data.access_token,
    redirectTo: role === 'MANUFACTURER' ? '/supplier' : '/buyer',
  });
  if (data.access_token && data.refresh_token) applyAuthCookies(result, data);
  return result;
}
