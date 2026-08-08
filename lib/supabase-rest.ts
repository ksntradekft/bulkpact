import { serviceDatabaseConfigured, supabaseServiceRoleKey, supabaseUrl } from './supabase-config';

export function serviceHeaders(extra: Record<string, string> = {}) {
  const key = supabaseServiceRoleKey();
  return { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...extra };
}

export async function serviceSelect<T>(path: string): Promise<T> {
  if (!serviceDatabaseConfigured()) throw new Error('A Supabase service role nincs beállítva.');
  const response = await fetch(`${supabaseUrl()}/rest/v1/${path}`, { headers: serviceHeaders(), cache: 'no-store' });
  if (!response.ok) throw new Error(`Supabase olvasási hiba: ${response.status} ${await response.text()}`);
  return response.json();
}

export async function serviceWrite<T>(path: string, init: RequestInit): Promise<T> {
  if (!serviceDatabaseConfigured()) throw new Error('A Supabase service role nincs beállítva.');
  const response = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: serviceHeaders({ Prefer: 'return=representation', ...(init.headers as Record<string, string> || {}) }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase írási hiba: ${response.status} ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export function userRestHeaders(accessToken: string, extra: Record<string, string> = {}) {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { apikey: key, Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', ...extra };
}
