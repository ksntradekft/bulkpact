import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE } from './auth-cookies';
import type { AppSession, AuthUser, Profile, UserRole } from './auth-types';
import { authConfigured, supabasePublishableKey, supabaseUrl } from './supabase-config';

function publicHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: supabasePublishableKey(),
    'Content-Type': 'application/json',
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

export async function fetchAuthUser(accessToken: string): Promise<AuthUser | null> {
  if (!authConfigured() || !accessToken) return null;
  const response = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: publicHeaders(accessToken),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchOwnProfile(accessToken: string, userId: string): Promise<Profile | null> {
  const response = await fetch(
    `${supabaseUrl()}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
    { headers: publicHeaders(accessToken), cache: 'no-store' },
  );
  if (!response.ok) return null;
  const rows = (await response.json()) as Profile[];
  return rows[0] || null;
}

export async function sessionFromToken(accessToken: string): Promise<AppSession | null> {
  const user = await fetchAuthUser(accessToken);
  if (!user) return null;
  const profile = await fetchOwnProfile(accessToken, user.id);
  if (!profile) return null;
  return { user, profile, accessToken };
}

export async function getCurrentSession(): Promise<AppSession | null> {
  if (!authConfigured()) return null;
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value || '';
  return sessionFromToken(token);
}

export async function getRequestSession(request: NextRequest): Promise<AppSession | null> {
  return sessionFromToken(request.cookies.get(ACCESS_COOKIE)?.value || '');
}

export function portalForRole(role: UserRole) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MANUFACTURER') return '/supplier';
  return '/buyer';
}

export function loginForRole(role: UserRole) {
  if (role === 'ADMIN') return '/admin/login';
  if (role === 'MANUFACTURER') return '/supplier/login';
  return '/buyer/login';
}

export async function requirePageRole(allowed: UserRole | UserRole[]) {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  const session = await getCurrentSession();
  if (!session) redirect(loginForRole(roles[0]));
  if (!roles.includes(session.profile.role)) redirect(portalForRole(session.profile.role));
  if (session.profile.status === 'SUSPENDED') redirect('/account-suspended');
  return session;
}

export async function requireApiRole(request: NextRequest, allowed: UserRole | UserRole[]) {
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  const session = await getRequestSession(request);
  if (!session) return { session: null, error: 'Nincs bejelentkezve.', status: 401 } as const;
  if (!roles.includes(session.profile.role)) return { session: null, error: 'Nincs jogosultsága ehhez a művelethez.', status: 403 } as const;
  if (session.profile.status === 'SUSPENDED') return { session: null, error: 'A fiók fel van függesztve.', status: 403 } as const;
  return { session, error: null, status: 200 } as const;
}
