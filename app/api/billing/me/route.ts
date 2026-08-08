import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth-server';
import { getAccountCommercialState } from '@/lib/monetization-server';
import { serviceSelect } from '@/lib/supabase-rest';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, ['BUYER','MANUFACTURER']);
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!['BUYER','MANUFACTURER'].includes(auth.session.profile.role)) return NextResponse.json({ error: 'Ehhez a fiókhoz nincs billing portál.' }, { status: 403 });
  try {
    const userId = auth.session.user.id;
    const [state, subscriptions, requests, ledger, entitlements, offers] = await Promise.all([
      getAccountCommercialState(userId, auth.session.profile.role),
      serviceSelect<any[]>(`subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=20`).catch(() => []),
      serviceSelect<any[]>(`billing_requests?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=30`).catch(() => []),
      serviceSelect<any[]>(`revenue_ledger?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=30`).catch(() => []),
      serviceSelect<any[]>(`account_entitlements?user_id=eq.${encodeURIComponent(userId)}&active=eq.true&select=*&order=created_at.desc`).catch(() => []),
      serviceSelect<any[]>('commercial_offers?active=eq.true&select=*&order=sort_order.asc').catch(() => []),
    ]);
    return NextResponse.json({ state, subscriptions, requests, ledger, entitlements, offers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Billing betöltési hiba.' }, { status: 500 });
  }
}
