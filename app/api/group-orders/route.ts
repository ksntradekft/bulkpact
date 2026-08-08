import { NextRequest, NextResponse } from 'next/server';
import { getRequestSession } from '@/lib/auth-server';
import { loadGroupOrders } from '@/lib/group-orders';
import { normalizeLocale } from '@/lib/i18n-shared';
import { translateGroupOrders } from '@/lib/dynamic-translations';
import { getPlatformSettings } from '@/lib/platform-settings';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const platformSettings=await getPlatformSettings();
    if(!platformSettings.group_orders_enabled)return NextResponse.json({group_orders:[],disabled:true});
    const session = await getRequestSession(request);
    const buyerId = session?.profile.role === 'BUYER' ? session.user.id : undefined;
    const locale = normalizeLocale(request.nextUrl.searchParams.get('locale') || request.cookies.get('bulkpact_locale')?.value);
    const raw = await loadGroupOrders({ buyerId, publicOnly: !buyerId });
    const groupOrders = await translateGroupOrders(raw, locale).catch(() => raw);
    const safeOrders = groupOrders.map(({ supplier_name, supplier_url: _supplierUrl, notes: _notes, commitments: _commitments, ...order }) => ({...order,supplier_display_name: session ? supplier_name : undefined}));
    return NextResponse.json({ group_orders: safeOrders, locale });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'A közös rendelések betöltése sikertelen.' }, { status: 500 });
  }
}
