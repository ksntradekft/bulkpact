import { getPlan, normalizePlanCode, type MonetizationAudience, type PlanEntitlements } from './monetization-catalog';
import { serviceSelect, serviceWrite } from './supabase-rest';

export type SupplierType = 'MANUFACTURER' | 'WHOLESALER' | 'BOTH';

export type AccountCommercialState = {
  audience: MonetizationAudience;
  supplierType: SupplierType | null;
  planCode: string;
  plan: ReturnType<typeof getPlan>;
  entitlements: PlanEntitlements;
  usage: { activeGroupOrders: number };
  credits: Record<string, number>;
};

export async function supplierTypeFor(userId: string): Promise<SupplierType> {
  const rows = await serviceSelect<any[]>(`manufacturer_profiles?id=eq.${encodeURIComponent(userId)}&select=supplier_type&limit=1`).catch(() => []);
  const value = String(rows[0]?.supplier_type || 'MANUFACTURER').toUpperCase();
  return value === 'WHOLESALER' || value === 'BOTH' ? value : 'MANUFACTURER';
}

export async function audienceFor(role: string, userId: string): Promise<{ audience: MonetizationAudience; supplierType: SupplierType | null }> {
  if (role === 'BUYER') return { audience: 'BUYER', supplierType: null };
  const supplierType = await supplierTypeFor(userId);
  return { audience: supplierType === 'WHOLESALER' ? 'WHOLESALER' : 'MANUFACTURER', supplierType };
}

export async function getAccountCommercialState(userId: string, role: string): Promise<AccountCommercialState> {
  const [{ audience, supplierType }, profiles, credits] = await Promise.all([
    audienceFor(role, userId),
    serviceSelect<any[]>(`profiles?id=eq.${encodeURIComponent(userId)}&select=plan,success_fee_pct&limit=1`).catch(() => []),
    serviceSelect<any[]>(`account_credits?user_id=eq.${encodeURIComponent(userId)}&select=credit_type,balance`).catch(() => []),
  ]);
  const profile = profiles[0] || {};
  const planCode = normalizePlanCode(profile.plan, audience);
  const plan = getPlan(planCode) || getPlan(normalizePlanCode('', audience));
  const entitlements: PlanEntitlements = { ...(plan?.entitlements || {}) };
  if (profile.success_fee_pct !== null && profile.success_fee_pct !== undefined && Number.isFinite(Number(profile.success_fee_pct))) entitlements.successFeePct = Number(profile.success_fee_pct);
  const groupOrders = role === 'MANUFACTURER'
    ? await serviceSelect<any[]>(`group_orders?created_by=eq.${encodeURIComponent(userId)}&status=in.(DRAFT,OPEN,FILLED,DEPOSIT,LOCKED,SUPPLIER_CONFIRMED,ORDERED,DISPATCHED)&select=id`).catch(() => [])
    : [];
  const creditMap: Record<string, number> = {};
  for (const c of credits) creditMap[String(c.credit_type)] = Number(c.balance || 0);
  return { audience, supplierType, planCode, plan, entitlements, usage: { activeGroupOrders: groupOrders.length }, credits: creditMap };
}

export function limitExceeded(current: number, limit: number | null | undefined) {
  return typeof limit === 'number' && current >= limit;
}

export async function consumeAccountCredit(userId: string, creditType: string, amount = 1): Promise<boolean> {
  try {
    const rows = await serviceWrite<any[]>('rpc/consume_account_credit', { method: 'POST', body: JSON.stringify({ p_user_id: userId, p_credit_type: creditType, p_amount: amount }) });
    return Boolean(rows && (Array.isArray(rows) ? rows[0] : rows));
  } catch { return false; }
}

export async function enforceSupplierGroupOrderLimit(userId: string) {
  const state = await getAccountCommercialState(userId, 'MANUFACTURER');
  return { allowed: !limitExceeded(state.usage.activeGroupOrders, state.entitlements.activeGroupOrders), state };
}
