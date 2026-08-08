import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth-server';
import {
  GROUP_ORDER_STATUSES,
  GROUP_ORDER_VISIBILITIES,
  loadGroupOrders,
  type GroupOrderStatus,
  type GroupOrderVisibility,
} from '@/lib/group-orders';
import { serviceSelect, serviceWrite } from '@/lib/supabase-rest';
import { notify } from '@/lib/notifications';
import { audit, trackEvent } from '@/lib/audit';
import { normalizeLocale } from '@/lib/i18n-shared';
import { primeGroupOrderEnglishTranslation, translateGroupOrders } from '@/lib/dynamic-translations';

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
  const auth = await requireApiRole(request, 'ADMIN');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const raw = await loadGroupOrders({ admin: true, includeCommitments: true });
    const locale = normalizeLocale(request.nextUrl.searchParams.get('locale') || request.cookies.get('bulkpact_locale')?.value);
    return NextResponse.json({ group_orders: await translateGroupOrders(raw, locale).catch(() => raw), locale });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'A közös beszerzések betöltése sikertelen.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiRole(request, 'ADMIN');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  const targetQuantity = positiveNumber(body.target_quantity);
  const minJoinQuantity = positiveNumber(body.min_join_quantity);
  const unitPrice = positiveNumber(body.unit_price);
  const priceUnitsPerOrderUnit = positiveNumber(body.price_units_per_order_unit);
  const deadline = optionalIsoDate(body.deadline);
  const status = text(body.status) as GroupOrderStatus;
  const visibility = text(body.visibility) as GroupOrderVisibility;

  if (!text(body.title) || !text(body.product_name)) {
    return NextResponse.json({ error: 'A kampány címe és a termék megadása kötelező.' }, { status: 400 });
  }
  if (!unitPrice) {
    return NextResponse.json({ error: 'A fix egységár megadása kötelező és 0-nál nagyobb kell legyen.' }, { status: 400 });
  }
  if (!priceUnitsPerOrderUnit) {
    return NextResponse.json({ error: 'Add meg, hány áregység tartozik egy foglalási egységhez.' }, { status: 400 });
  }
  if (!targetQuantity || !minJoinQuantity || minJoinQuantity > targetQuantity) {
    return NextResponse.json({ error: 'A célmennyiség vagy a minimum csatlakozási mennyiség hibás.' }, { status: 400 });
  }
  if (deadline === undefined) {
    return NextResponse.json({ error: 'A jelentkezési határidő formátuma hibás.' }, { status: 400 });
  }
  if (!GROUP_ORDER_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Érvénytelen kampánystátusz.' }, { status: 400 });
  }
  if (!GROUP_ORDER_VISIBILITIES.includes(visibility)) {
    return NextResponse.json({ error: 'Érvénytelen láthatóság.' }, { status: 400 });
  }

  const payload = {
    created_by: auth.session.user.id,
    title: text(body.title),
    brand: text(body.brand),
    product_name: text(body.product_name),
    product_description: text(body.product_description),
    category: text(body.category) || 'Egyéb',
    supplier_name: text(body.supplier_name),
    supplier_url: text(body.supplier_url) || null,
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
    status,
    visibility,
    notes: text(body.notes),
    freight_total: optionalNonNegativeNumber(body.freight_total) ?? 0,
    handling_total: optionalNonNegativeNumber(body.handling_total) ?? 0,
    customs_total: optionalNonNegativeNumber(body.customs_total) ?? 0,
    insurance_total: optionalNonNegativeNumber(body.insurance_total) ?? 0,
    other_costs_total: optionalNonNegativeNumber(body.other_costs_total) ?? 0,
    landed_cost_notes: text(body.landed_cost_notes),
    lifecycle_updated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const rows = await serviceWrite<any[]>('group_orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const order = rows?.[0] || null;
    if (order) { await primeGroupOrderEnglishTranslation(order).catch(() => null); await audit(auth.session.user.id,'GROUP_ORDER_CREATED','GROUP_ORDER',order.id,{status:order.status,target_quantity:order.target_quantity}); await trackEvent(auth.session.user.id,'ADMIN','GROUP_ORDER_CREATED','GROUP_ORDER',order.id,{status:order.status}); }
    return NextResponse.json({ group_order: order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'A közös rendelés mentése sikertelen.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireApiRole(request, 'ADMIN');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => ({}));
  if (body.commitment_id) {
    const commitmentId=text(body.commitment_id);
    const allowedDeposit=['NOT_REQUIRED','DUE','PAID','REFUNDED'];
    const allowedStatus=['RESERVED','CONFIRMED','CANCELLED','ALLOCATED'];
    const patchCommitment:Record<string,unknown>={updated_at:new Date().toISOString()};
    if(body.deposit_status!==undefined){const d=text(body.deposit_status);if(!allowedDeposit.includes(d))return NextResponse.json({error:'Érvénytelen előlegstátusz.'},{status:400});patchCommitment.deposit_status=d;if(d==='PAID')patchCommitment.deposit_paid_at=new Date().toISOString()}
    if(body.deposit_amount!==undefined)patchCommitment.deposit_amount=optionalNonNegativeNumber(body.deposit_amount);
    if(body.deposit_currency!==undefined)patchCommitment.deposit_currency=text(body.deposit_currency).toUpperCase()||'EUR';
    if(body.deposit_due_at!==undefined){const dd=optionalIsoDate(body.deposit_due_at);if(dd===undefined)return NextResponse.json({error:'Hibás előleghatáridő.'},{status:400});patchCommitment.deposit_due_at=dd}
    if(body.payment_reference!==undefined)patchCommitment.payment_reference=text(body.payment_reference)||null;
    if(body.commitment_status!==undefined){const st=text(body.commitment_status);if(!allowedStatus.includes(st))return NextResponse.json({error:'Érvénytelen foglalási státusz.'},{status:400});patchCommitment.status=st}
    const old=(await serviceSelect<any[]>(`group_order_commitments?id=eq.${encodeURIComponent(commitmentId)}&select=buyer_id,group_order_id&limit=1`).catch(()=>[]))[0];
    const rows=await serviceWrite<any[]>(`group_order_commitments?id=eq.${encodeURIComponent(commitmentId)}`,{method:'PATCH',body:JSON.stringify(patchCommitment)});
    if(old?.buyer_id)await notify(old.buyer_id,'Közös beszerzés frissítve','A foglalásod vagy előlegstátuszod módosult.','/buyer/group-orders','GROUP_ORDER');
    await audit(auth.session.user.id,'GROUP_ORDER_COMMITMENT_UPDATED','GROUP_ORDER',old?.group_order_id||null,{commitment_id:commitmentId,...patchCommitment});
    return NextResponse.json({commitment:rows?.[0]||null});
  }

  const id = text(body.id);
  if (!id) return NextResponse.json({ error: 'Hiányzó kampányazonosító.' }, { status: 400 });

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  let previousStatus:string|undefined;
  if (body.status !== undefined) {
    const status = text(body.status) as GroupOrderStatus;
    if (!GROUP_ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Érvénytelen státusz.' }, { status: 400 });
    }
    const oldRows=await serviceSelect<any[]>(`group_orders?id=eq.${encodeURIComponent(id)}&select=status&limit=1`).catch(()=>[]);previousStatus=oldRows[0]?.status;
    patch.status = status; patch.lifecycle_updated_at=new Date().toISOString();
  }
  if (body.deadline !== undefined) {
    const deadline = optionalIsoDate(body.deadline);
    if (deadline === undefined) return NextResponse.json({ error: 'Hibás határidő.' }, { status: 400 });
    patch.deadline = deadline;
  }
  if (body.notes !== undefined) patch.notes = text(body.notes);
  if (body.unit_price !== undefined) {
    const price = positiveNumber(body.unit_price);
    if (!price) return NextResponse.json({ error: 'A fix egységár 0-nál nagyobb kell legyen.' }, { status: 400 });
    patch.unit_price = price;
  }
  if (body.price_unit !== undefined) patch.price_unit = text(body.price_unit) || 'db';
  if (body.price_units_per_order_unit !== undefined) {
    const conversion = positiveNumber(body.price_units_per_order_unit);
    if (!conversion) return NextResponse.json({ error: 'Az áregység/foglalási egység arány 0-nál nagyobb kell legyen.' }, { status: 400 });
    patch.price_units_per_order_unit = conversion;
  }
  for (const k of ['freight_total','handling_total','customs_total','insurance_total','other_costs_total'] as const) if (body[k] !== undefined) patch[k] = optionalNonNegativeNumber(body[k]) ?? 0;
  if (body.landed_cost_notes !== undefined) patch.landed_cost_notes = text(body.landed_cost_notes);

  try {
    const rows = await serviceWrite<any[]>(`group_orders?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch) });
    if(previousStatus&&patch.status&&previousStatus!==patch.status){const commitments=await serviceSelect<any[]>(`group_order_commitments?group_order_id=eq.${encodeURIComponent(id)}&status=neq.CANCELLED&select=buyer_id`).catch(()=>[]);for(const buyerId of [...new Set(commitments.map(x=>x.buyer_id).filter(Boolean))])await notify(String(buyerId),'Group Order státusz frissült',`${previousStatus} → ${patch.status}`,'/buyer/group-orders','GROUP_ORDER');}
    await audit(auth.session.user.id,'GROUP_ORDER_UPDATED','GROUP_ORDER',id,{previous_status:previousStatus,...patch});
    return NextResponse.json({ group_order: rows?.[0] || null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'A kampány módosítása sikertelen.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiRole(request, 'ADMIN');
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const id = text(request.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'Hiányzó kampányazonosító.' }, { status: 400 });

  try {
    await serviceWrite<unknown>(`group_orders?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'A kampány törlése sikertelen.' },
      { status: 500 },
    );
  }
}
