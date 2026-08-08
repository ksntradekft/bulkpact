import { NextRequest, NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth-server';
import { MONETIZATION_ADDONS, MONETIZATION_PLANS, normalizePlanCode } from '@/lib/monetization-catalog';
import { audienceFor } from '@/lib/monetization-server';
import { serviceSelect, serviceWrite } from '@/lib/supabase-rest';

const text=(v:unknown)=>String(v??'').trim();
export async function POST(request: NextRequest) {
  const auth = await requireApiRole(request, ['BUYER','MANUFACTURER']);
  if (!auth.session) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!['BUYER','MANUFACTURER'].includes(auth.session.profile.role)) return NextResponse.json({ error: 'Nem támogatott fióktípus.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const offerCode = text(body.offer_code).toUpperCase();
  const billingCycle = text(body.billing_cycle).toUpperCase() || 'MONTHLY';
  const { audience, supplierType } = await audienceFor(auth.session.profile.role, auth.session.user.id);
  const plan = MONETIZATION_PLANS.find(p => p.code === offerCode);
  const addon = MONETIZATION_ADDONS.find(a => a.code === offerCode);
  if (!plan && !addon) return NextResponse.json({ error: 'Ismeretlen kereskedelmi ajánlat.' }, { status: 400 });
  const catalog = (await serviceSelect<any[]>(`commercial_offers?code=eq.${encodeURIComponent(offerCode)}&active=eq.true&select=code&limit=1`).catch(() => []))[0];
  if (!catalog) return NextResponse.json({ error: 'Ez a kereskedelmi ajánlat jelenleg nem aktív.' }, { status: 409 });
  if (plan && plan.audience !== audience && !(supplierType === 'BOTH' && ['MANUFACTURER','WHOLESALER'].includes(plan.audience))) return NextResponse.json({ error: 'Ez a csomag ehhez a fióktípushoz nem érhető el.' }, { status: 403 });
  if (addon && !addon.audiences.includes(audience) && !(supplierType === 'BOTH' && addon.audiences.some(a => ['MANUFACTURER','WHOLESALER'].includes(a)))) return NextResponse.json({ error: 'Ez a kiegészítő ehhez a fióktípushoz nem érhető el.' }, { status: 403 });
  const open = await serviceSelect<any[]>(`billing_requests?user_id=eq.${encodeURIComponent(auth.session.user.id)}&offer_code=eq.${encodeURIComponent(offerCode)}&status=in.(REQUESTED,IN_REVIEW,APPROVED)&select=id&limit=1`).catch(() => []);
  if (open.length) return NextResponse.json({ error: 'Ehhez az ajánlathoz már van folyamatban lévő kérelmed.' }, { status: 409 });
  const metadata = typeof body.metadata === 'object' && body.metadata ? body.metadata : {};
  const rows = await serviceWrite<any[]>('billing_requests', { method:'POST', body:JSON.stringify({ user_id:auth.session.user.id, offer_code:offerCode, request_type:plan?'PLAN_CHANGE':'PURCHASE', billing_cycle:plan?(billingCycle==='YEARLY'?'YEARLY':'MONTHLY'):null, quantity:Math.max(1,Number(body.quantity)||1), status:'REQUESTED', notes:text(body.notes), metadata }) });
  if (plan) await serviceWrite(`profiles?id=eq.${encodeURIComponent(auth.session.user.id)}`, { method:'PATCH', body:JSON.stringify({ subscription_status:'REQUESTED' }) }).catch(()=>null);
  return NextResponse.json({ request: rows?.[0] || null, normalized_current_plan: normalizePlanCode(auth.session.profile.role==='BUYER'?'BUYER_FREE':'MFG_STARTER', audience) });
}
