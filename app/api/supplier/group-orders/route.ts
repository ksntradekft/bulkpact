import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth-server';
import { loadGroupOrders } from '@/lib/group-orders';
import { serviceWrite } from '@/lib/supabase-rest';
import { normalizeLocale } from '@/lib/i18n-shared';
import { primeGroupOrderEnglishTranslation, translateGroupOrders } from '@/lib/dynamic-translations';
import { enforceSupplierGroupOrderLimit } from '@/lib/monetization-server';
import { getPlatformSettings } from '@/lib/platform-settings';

export const dynamic = 'force-dynamic';

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function positiveNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function optionalNonNegativeNumber(value: unknown): number | null {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function optionalIsoDate(value: unknown): string | null | undefined {
  if (value === '' || value == null) return null;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiRole(request, 'MANUFACTURER');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const raw = await loadGroupOrders({ createdBy: auth.session.user.id, includeCommitments: true });
    const locale = normalizeLocale(request.nextUrl.searchParams.get('locale') || request.cookies.get('bulkpact_locale')?.value);
    const groupOrders = await translateGroupOrders(raw, locale).catch(() => raw);
    const commercial = await import('@/lib/monetization-server').then(m => m.getAccountCommercialState(auth.session!.user.id, 'MANUFACTURER')).catch(() => null);
    return NextResponse.json({ group_orders: groupOrders, commercial });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Az ajánlatok betöltése sikertelen.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {const ps=await getPlatformSettings();if(!ps.group_orders_enabled)return NextResponse.json({error:'Group Orders are currently disabled.'},{status:503});
  const auth = await requireApiRole(request, 'MANUFACTURER');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const limit = await enforceSupplierGroupOrderLimit(auth.session.user.id);
  if (!limit.allowed) return NextResponse.json({ error: `Elérted az aktív Group Order limitedet (${limit.state.entitlements.activeGroupOrders}). Válts magasabb csomagra vagy zárj le egy kampányt.`, upgrade_required: true, plan: limit.state.planCode }, { status: 402 });

  const body = await request.json().catch(() => ({}));
  const targetQuantity = positiveNumber(body.target_quantity);
  const minJoinQuantity = positiveNumber(body.min_join_quantity);
  const unitPrice = positiveNumber(body.unit_price);
  const priceUnitsPerOrderUnit = positiveNumber(body.price_units_per_order_unit);
  const deadline = optionalIsoDate(body.deadline);

  if (!text(body.title) || !text(body.product_name)) {
    return NextResponse.json({ error: 'Az ajánlat címe és a termék megadása kötelező.' }, { status: 400 });
  }
  if (!unitPrice) {
    return NextResponse.json({ error: 'A fix egységár megadása kötelező és 0-nál nagyobb kell legyen.' }, { status: 400 });
  }
  if (!priceUnitsPerOrderUnit) {
    return NextResponse.json({ error: 'Add meg, hány áregység tartozik egy foglalási egységhez.' }, { status: 400 });
  }
  if (!targetQuantity || !minJoinQuantity || minJoinQuantity > targetQuantity) {
    return NextResponse.json({ error: 'A célmennyiség vagy a minimum csatlakozás hibás.' }, { status: 400 });
  }
  if (deadline === undefined) {
    return NextResponse.json({ error: 'A jelentkezési határidő formátuma hibás.' }, { status: 400 });
  }

  const payload = {
    created_by: auth.session.user.id,
    title: text(body.title),
    brand: text(body.brand),
    product_name: text(body.product_name),
    product_description: text(body.product_description),
    category: text(body.category) || 'Egyéb',
    supplier_name: auth.session.profile.company_name || auth.session.profile.full_name,
    supplier_url: text(body.supplier_url) || auth.session.profile.website || null,
    moq_label: text(body.moq_label) || null,
    target_quantity: targetQuantity,
    unit: text(body.unit) || 'db',
    min_join_quantity: minJoinQuantity,
    unit_price: unitPrice,
    price_unit: text(body.price_unit) || text(body.unit) || 'db',
    price_units_per_order_unit: priceUnitsPerOrderUnit,
    currency: text(body.currency).toUpperCase() || 'EUR',
    destination_country: text(body.destination_country) || 'Magyarország',
    deadline,
    status: 'DRAFT',
    visibility: 'BUYERS_ONLY',
    notes: text(body.notes),
    platform_fee_pct: Number(limit.state.entitlements.groupOrderFeePct || 0),
    commission_status: 'NOT_DUE',
    updated_at: new Date().toISOString(),
  };

  try {
    const rows = await serviceWrite<any[]>('group_orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const order = rows?.[0] || null;
    if (order) await primeGroupOrderEnglishTranslation(order).catch(() => null);
    return NextResponse.json({ group_order: order, plan: limit.state.planCode });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Az ajánlat mentése sikertelen.' },
      { status: 500 },
    );
  }
}
