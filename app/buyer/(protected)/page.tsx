import Link from 'next/link';
import { Calculator, CreditCard, MessageSquare, PackageCheck, ShoppingCart, Store, WalletCards } from 'lucide-react';
import { requirePageRole } from '@/lib/auth-server';
import { serviceSelect } from '@/lib/supabase-rest';
import { getLocale } from '@/lib/i18n-server';
import { getAccountCommercialState } from '@/lib/monetization-server';
export const dynamic='force-dynamic';
export default async function Page(){
  const locale=await getLocale();const en=locale==='en';const s=await requirePageRole('BUYER');
  const[commitments,commercial]=await Promise.all([
    serviceSelect<any[]>(`group_order_commitments?buyer_id=eq.${s.user.id}&select=id,group_order_id,status,deposit_status,quantity`).catch(()=>[]),
    getAccountCommercialState(s.user.id,'BUYER').catch(()=>null),
  ]);
  const active=commitments.filter(x=>x.status!=='CANCELLED'),deposits=active.filter(x=>x.deposit_status==='DUE').length,allocated=active.filter(x=>x.status==='ALLOCATED').length;
  return <main className="portal-page"><p className="eyebrow">{en?'BUYER PORTAL':'VEVŐI PORTÁL'}</p><h1>{en?'Welcome':'Üdvözlünk'}, {s.profile.company_name}</h1><p className="portal-lead">{en?'Join fixed-price Group Orders, manage commitments and deposits, and follow each deal from MOQ to delivery.':'Csatlakozz fix árú Group Orderekhez, kezeld a foglalásaidat és előlegeidet, és kövesd a dealeket az MOQ-tól a kézbesítésig.'}</p>
  <section className="commercial-note dashboard-plan-card"><div><CreditCard size={17}/><strong>{en?'Current plan':'Aktuális csomag'}: {commercial?.planCode||'BUYER_FREE'}</strong></div><span>{en?'Group buying account for business purchasing.':'Üzleti közös beszerzési fiók.'}</span><Link href="/buyer/billing">{en?'Plans & billing':'Csomagok és számlázás'} →</Link></section>
  <section className="portal-stat-grid kpi-grid"><article><ShoppingCart/><span>{en?'Active commitments':'Aktív foglalások'}</span><strong>{active.length}</strong></article><article><WalletCards/><span>{en?'Deposits due':'Esedékes előlegek'}</span><strong>{deposits}</strong></article><article><PackageCheck/><span>{en?'Allocated commitments':'Allokált foglalások'}</span><strong>{allocated}</strong></article></section>
  <section className="portal-link-grid"><Link href="/buyer/group-orders"><ShoppingCart/><div><strong>{en?'Browse Group Orders':'Közös rendelések'}</strong><span>{en?'Fixed price, fixed MOQ, live fill progress.':'Fix ár, fix MOQ, élő telítettség.'}</span></div></Link><Link href="/buyer/messages"><MessageSquare/><div><strong>{en?'Supplier messages':'Beszállítói üzenetek'}</strong><span>{en?'Private conversation for committed Group Orders.':'Privát kommunikáció azoknál a Group Ordereknél, amelyekhez csatlakoztál.'}</span></div></Link><Link href="/buyer/landed-cost"><Calculator/><div><strong>Landed cost</strong><span>{en?'Estimate delivered cost before committing.':'Becsüld meg a teljes bekerülési költséget foglalás előtt.'}</span></div></Link><Link href="/buyer/profile"><Store/><div><strong>{en?'Company profile':'Céges profil'}</strong><span>{en?'Keep billing, country and contact data current.':'Tartsd naprakészen a számlázási, ország- és kapcsolattartói adatokat.'}</span></div></Link></section>
  </main>;
}
