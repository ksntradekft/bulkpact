'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeEuro, CheckCircle2, CircleDollarSign, RefreshCw, Save, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { MONETIZATION_PLANS } from '@/lib/monetization-catalog';
import type { Locale } from '@/lib/i18n-shared';

type Props = { locale?: Locale };
async function json(response: Response) { const text = await response.text(); try { return text ? JSON.parse(text) : {}; } catch { return { error: text }; } }
function money(value: unknown, currency = 'EUR', locale: Locale = 'hu') { const n = Number(value || 0); try { return new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'hu-HU', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n); } catch { return `${n.toLocaleString()} ${currency}`; } }

export default function CommercialClient({ locale = 'hu' }: Props) {
  const en = locale === 'en';
  const t = (hu: string, eng: string) => en ? eng : hu;
  const [data, setData] = useState<any>({ groupOrders: [], profiles: [], deletions: [], requests: [], ledger: [], offers: [], kpis: {} });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setErr('');
    const response = await fetch('/api/admin/commercial', { cache: 'no-store' });
    const payload = await json(response);
    if (response.ok) setData(payload); else setErr(payload.error || t('Betöltési hiba.', 'Load failed.'));
  }, [en]);
  useEffect(() => { void load(); }, [load]);

  async function patch(payload: any, key = 'save') {
    setBusy(key); setMsg(''); setErr('');
    const response = await fetch('/api/admin/commercial', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await json(response);
    if (response.ok) { setMsg(t('Mentve.', 'Saved.')); await load(); } else setErr(result.error || t('Mentési hiba.', 'Save failed.'));
    setBusy('');
  }

  const planOptions = useMemo(() => MONETIZATION_PLANS, []);
  const k = data.kpis || {};
  return <div className="platform-stack">
    <section className="portal-stat-grid commercial-kpis">
      <article><span>MRR</span><strong>{money(k.mrr, 'EUR', locale)}</strong><small>{t('Havi ismétlődő bevétel', 'Monthly recurring revenue')}</small></article>
      <article><span>ARR</span><strong>{money(k.arr, 'EUR', locale)}</strong><small>{t('Évesített run-rate', 'Annualized run-rate')}</small></article>
      <article><span>{t('Kifizetett bevétel', 'Paid revenue')}</span><strong>{money(k.paid_revenue, 'EUR', locale)}</strong><small>{t('Ledger PAID', 'Ledger PAID')}</small></article>
      <article><span>{t('Nyitott bevétel', 'Open revenue')}</span><strong>{money(k.open_revenue, 'EUR', locale)}</strong><small>{t('Pending + invoiced', 'Pending + invoiced')}</small></article>
      <article><span>EUR GMV</span><strong>{money(k.eur_gmv, 'EUR', locale)}</strong><small>{t('MOQ-t elért Group Orderek','Group Orders that reached MOQ')}</small></article>
      <article><span>{t('Fizetős fiókok', 'Paid accounts')}</span><strong>{k.active_paid_accounts || 0}</strong><small>{t('Aktív magasabb csomag', 'Active upgraded plans')}</small></article>
      <article><span>{t('Váró billing kérelmek', 'Pending billing requests')}</span><strong>{k.pending_requests || 0}</strong><small>{t('Admin döntésre vár', 'Awaiting admin review')}</small></article>
      <article><span>{t('Group Order platform fee', 'Group Order platform fees')}</span><strong>{money(k.eur_order_fees, 'EUR', locale)}</strong><small>{t('Rögzített platformdíj', 'Recorded platform fee')}</small></article>
    </section>

    {err && <div className="run-error">{err}</div>}{msg && <div className="run-report">{msg}</div>}

    <section className="manufacturer-panel">
      <div className="manufacturer-toolbar"><div><strong>{t('Előfizetési és fizetős szolgáltatás kérelmek', 'Subscription & paid-service requests')}</strong><small>{t('A prototípusban az admin jóváhagyás aktiválja a csomagot/szolgáltatást és létrehozza a számlázási ledger tételt.', 'In the prototype, admin approval activates the plan/service and creates the billing-ledger charge.')}</small></div><button className="icon-button" onClick={() => void load()} aria-label={t('Frissítés', 'Refresh')}><RefreshCw size={17}/></button></div>
      <div className="quote-table-wrap"><table className="quote-table"><thead><tr><th>{t('Fiók', 'Account')}</th><th>{t('Ajánlat', 'Offer')}</th><th>{t('Típus', 'Type')}</th><th>{t('Ciklus', 'Cycle')}</th><th>{t('Mennyiség', 'Qty')}</th><th>{t('Státusz', 'Status')}</th><th>{t('Művelet', 'Action')}</th></tr></thead><tbody>
        {(data.requests || []).map((r: any) => { const p = (data.profiles || []).find((x: any) => x.id === r.user_id); return <tr key={r.id}><td><strong>{p?.company_name || p?.email || r.user_id}</strong><small>{p?.role}{p?.supplier_type ? ` · ${p.supplier_type}` : ''}</small></td><td><strong>{r.offer_code}</strong><small>{new Date(r.created_at).toLocaleString(en ? 'en-GB' : 'hu-HU')}</small></td><td>{r.request_type}</td><td>{r.billing_cycle || '—'}</td><td>{r.quantity || 1}</td><td><span className={`group-status status-${String(r.status).toLowerCase()}`}>{r.status}</span></td><td><div className="table-actions"><button disabled={busy !== '' || r.status === 'FULFILLED'} title={t('Jóváhagyás és aktiválás', 'Approve & activate')} onClick={() => void patch({ billing_request_id: r.id, status: 'APPROVED' }, `req-${r.id}`)}><CheckCircle2 size={16}/></button><button disabled={busy !== '' || r.status === 'FULFILLED'} title={t('Elutasítás', 'Reject')} onClick={() => void patch({ billing_request_id: r.id, status: 'REJECTED' }, `req-${r.id}`)}>×</button></div></td></tr>; })}
        {(data.requests || []).length === 0 && <tr><td colSpan={7}>{t('Nincs billing kérelem.', 'No billing requests.')}</td></tr>}
      </tbody></table></div>
    </section>

    <section className="manufacturer-panel">
      <div className="manufacturer-toolbar"><div><strong>{t('Fiókcsomagok és tranzakciós díjak', 'Account plans & transaction fees')}</strong><small>{t('A vevők és beszállítók Group Order-aktivitásához igazított csomagstruktúra.', 'Plans aligned to buyer and supplier Group Order activity.')}</small></div><Users size={20}/></div>
      <div className="quote-table-wrap"><table className="quote-table"><thead><tr><th>{t('Cég', 'Company')}</th><th>{t('Típus', 'Type')}</th><th>{t('Csomag', 'Plan')}</th><th>{t('Billing', 'Billing')}</th><th>Success fee %</th></tr></thead><tbody>{(data.profiles || []).filter((p:any)=>p.role!=='ADMIN').map((p: any) => {
        const allowed = planOptions.filter(plan => p.role === 'BUYER' ? plan.audience === 'BUYER' : p.supplier_type === 'WHOLESALER' ? plan.audience === 'WHOLESALER' : p.supplier_type === 'BOTH' ? ['MANUFACTURER','WHOLESALER'].includes(plan.audience) : plan.audience === 'MANUFACTURER');
        return <tr key={p.id}><td><strong>{p.company_name || p.email}</strong><small>{p.email}</small></td><td>{p.role}{p.supplier_type ? ` · ${p.supplier_type}` : ''}</td><td><select value={p.plan || (p.role === 'BUYER' ? 'BUYER_FREE' : 'MFG_STARTER')} onChange={e => void patch({ profile_id: p.id, plan: e.target.value, success_fee_pct: p.success_fee_pct, subscription_status: e.target.value.endsWith('_FREE') || e.target.value.endsWith('_STARTER') ? 'FREE' : 'ACTIVE' }, `profile-${p.id}`)}>{allowed.map(plan => <option key={plan.code} value={plan.code}>{plan.code} · {en ? plan.nameEn : plan.nameHu}</option>)}</select></td><td><select value={p.subscription_status || 'FREE'} onChange={e=>void patch({profile_id:p.id,subscription_status:e.target.value},`profile-${p.id}`)}>{['FREE','REQUESTED','ACTIVE','PAST_DUE','CANCELLED','EXPIRED'].map(x=><option key={x}>{x}</option>)}</select></td><td><input type="number" min="0" step="0.1" defaultValue={p.success_fee_pct ?? ''} onBlur={e => void patch({ profile_id: p.id, success_fee_pct: e.target.value }, `profile-${p.id}`)} /></td></tr>;
      })}</tbody></table></div>
    </section>

    <section className="manufacturer-panel">
      <div className="manufacturer-toolbar"><div><strong>{t('Kereskedelmi ajánlatkatalógus', 'Commercial offer catalog')}</strong><small>{t('Adminból átárazható, ki-/bekapcsolható ajánlatok. A publikus és billing oldal a DB árat használja.', 'Admin-editable offers. Public pricing and billing use the database price.')}</small></div><Sparkles size={20}/></div>
      <div className="quote-table-wrap"><table className="quote-table"><thead><tr><th>Code</th><th>{t('Közönség', 'Audience')}</th><th>{t('Típus', 'Type')}</th><th>{t('Név', 'Name')}</th><th>{t('Havi / egyszeri ár', 'Monthly / one-off price')}</th><th>{t('Éves ár', 'Annual price')}</th><th>{t('Aktív', 'Active')}</th><th>{t('Kiemelt', 'Featured')}</th></tr></thead><tbody>{(data.offers || []).map((o:any)=><tr key={o.code}><td><strong>{o.code}</strong><small>{o.billing_period}</small></td><td>{o.audience}</td><td>{o.offer_type}</td><td>{en?o.name_en:o.name_hu}</td><td>{o.billing_period==='PERCENTAGE'?<div className="percent-input"><input type="number" min="0" step="0.1" defaultValue={o.price_pct ?? ''} onBlur={e=>void patch({offer_code:o.code,price_pct:e.target.value},`offer-${o.code}`)}/><span>%</span></div>:<input type="number" min="0" step="0.01" defaultValue={o.price ?? ''} placeholder={t('Egyedi','Custom')} onBlur={e=>void patch({offer_code:o.code,price:e.target.value},`offer-${o.code}`)}/>}</td><td>{o.offer_type==='PLAN'&&o.billing_period!=='FREE'&&o.billing_period!=='CUSTOM'?<input type="number" min="0" step="0.01" defaultValue={o.metadata?.yearly ?? ''} placeholder={t('Éves ár','Annual price')} onBlur={e=>void patch({offer_code:o.code,yearly_price:e.target.value},`offer-year-${o.code}`)}/>:<span>—</span>}</td><td><input type="checkbox" checked={Boolean(o.active)} onChange={e=>void patch({offer_code:o.code,active:e.target.checked},`offer-${o.code}`)}/></td><td><input type="checkbox" checked={Boolean(o.featured)} onChange={e=>void patch({offer_code:o.code,featured:e.target.checked},`offer-${o.code}`)}/></td></tr>)}</tbody></table></div>
    </section>

    <section className="manufacturer-panel">
      <div className="manufacturer-toolbar"><div><strong>{t('Bevételi ledger', 'Revenue ledger')}</strong><small>{t('Előfizetés, Group Order díj, boost, verification és egyéb bevételi tételek.', 'Subscriptions, Group Order fees, boosts, verification and other revenue lines.')}</small></div><BadgeEuro size={20}/></div>
      <div className="quote-table-wrap"><table className="quote-table"><thead><tr><th>{t('Forrás', 'Source')}</th><th>{t('Leírás', 'Description')}</th><th>{t('Fiók', 'Account')}</th><th>{t('Összeg', 'Amount')}</th><th>{t('Státusz', 'Status')}</th><th>{t('Dátum', 'Date')}</th></tr></thead><tbody>{(data.ledger || []).map((r:any)=>{const p=(data.profiles||[]).find((x:any)=>x.id===r.user_id);return <tr key={r.id}><td>{r.source_type}<small>{r.offer_code||''}</small></td><td>{r.description||'—'}</td><td>{p?.company_name||p?.email||'—'}</td><td><strong>{money(r.amount,r.currency,locale)}</strong></td><td><select value={r.status} onChange={e=>void patch({ledger_id:r.id,status:e.target.value},`ledger-${r.id}`)}>{['PENDING','INVOICED','PAID','WAIVED','REFUNDED'].map(x=><option key={x}>{x}</option>)}</select></td><td>{new Date(r.created_at).toLocaleDateString(en?'en-GB':'hu-HU')}</td></tr>})}</tbody></table></div>
    </section>

    <section className="manufacturer-panel"><div className="manufacturer-toolbar"><div><strong>Group Order {t('jutalékok', 'fees')}</strong><small>{t('A teljes MOQ célértékére számított közös beszerzési platformdíj.', 'Pooled-order platform fee calculated from the target lot value.')}</small></div><CircleDollarSign size={20}/></div><div className="quote-table-wrap"><table className="quote-table"><thead><tr><th>{t('Kampány', 'Campaign')}</th><th>{t('Célérték', 'Target value')}</th><th>Fee %</th><th>Fee</th><th>{t('Státusz', 'Status')}</th></tr></thead><tbody>{(data.groupOrders || []).map((o:any)=><tr key={o.id}><td><strong>{o.title}</strong><small>{o.status}</small></td><td>{money((Number(o.target_quantity)||0)*(Number(o.unit_price)||0),o.currency,locale)}</td><td><input type="number" min="0" step="0.1" defaultValue={o.platform_fee_pct||0} onBlur={e=>void patch({group_order_id:o.id,platform_fee_pct:e.target.value,commission_status:o.commission_status},`go-${o.id}`)}/></td><td>{money(o.platform_fee_amount,o.currency,locale)}</td><td><select value={o.commission_status||'NOT_DUE'} onChange={e=>void patch({group_order_id:o.id,platform_fee_pct:o.platform_fee_pct,commission_status:e.target.value},`go-${o.id}`)}>{['NOT_DUE','DUE','INVOICED','PAID','WAIVED'].map(x=><option key={x}>{x}</option>)}</select></td></tr>)}</tbody></table></div></section>

    <section className="manufacturer-panel"><div className="manufacturer-toolbar"><div><strong>{t('Adat-/fióktörlési kérelmek', 'Data/account deletion requests')}</strong><small>{t('GDPR admin workflow.', 'GDPR admin workflow.')}</small></div><ShieldCheck size={20}/></div><div className="quote-table-wrap"><table className="quote-table"><thead><tr><th>User</th><th>{t('Indok', 'Reason')}</th><th>{t('Státusz', 'Status')}</th><th>{t('Dátum', 'Date')}</th></tr></thead><tbody>{(data.deletions || []).map((d:any)=><tr key={d.id}><td>{d.user_id}</td><td>{d.reason||'—'}</td><td><select value={d.status} onChange={e=>void patch({deletion_id:d.id,status:e.target.value},`del-${d.id}`)}>{['REQUESTED','IN_REVIEW','COMPLETED','REJECTED'].map(x=><option key={x}>{x}</option>)}</select></td><td>{new Date(d.created_at).toLocaleString(en?'en-GB':'hu-HU')}</td></tr>)}</tbody></table></div></section>
  </div>;
}
