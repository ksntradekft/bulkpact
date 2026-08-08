import Link from 'next/link';
import { BadgeCheck, Building2, CreditCard, MessageSquare, PackageCheck, ShoppingCart } from 'lucide-react';
import { requirePageRole } from '@/lib/auth-server';
import { serviceSelect } from '@/lib/supabase-rest';
import { getLocale } from '@/lib/i18n-server';
import { getAccountCommercialState } from '@/lib/monetization-server';
export const dynamic='force-dynamic';
export default async function Page(){
  const locale=await getLocale();const en=locale==='en';const s=await requirePageRole('MANUFACTURER');
  const[p,campaigns,commercial]=await Promise.all([
    serviceSelect<any[]>(`manufacturer_profiles?id=eq.${s.user.id}&select=approval_status,verification_level,supplier_type&limit=1`).then(x=>x[0]).catch(()=>null),
    serviceSelect<any[]>(`group_orders?created_by=eq.${s.user.id}&select=id,status,target_quantity`).catch(()=>[]),
    getAccountCommercialState(s.user.id,'MANUFACTURER').catch(()=>null),
  ]);
  const active=campaigns.filter(x=>['DRAFT','OPEN','FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED'].includes(x.status));
  const reached=campaigns.filter(x=>['FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED'].includes(x.status));
  const completed=campaigns.filter(x=>x.status==='COMPLETED').length;
  return <main className="portal-page"><p className="eyebrow">{en?'SUPPLIER PORTAL':'BESZÁLLÍTÓI PORTÁL'}</p><h1>{s.profile.company_name}</h1><p className="portal-lead">{en?'Publish high-MOQ fixed-price opportunities and let independent businesses aggregate the order.':'Tegyél közzé magas MOQ-s, fix árú ajánlatokat, és hagyd, hogy független vállalkozások együtt rakják össze a rendelést.'}</p>
  <section className="commercial-note dashboard-plan-card"><div><CreditCard size={17}/><strong>{en?'Current plan':'Aktuális csomag'}: {commercial?.planCode||'MFG_STARTER'}</strong></div><span>{p?.supplier_type||'SUPPLIER'} · {en?'Group Order fee':'Group Order díj'}: {commercial?.entitlements.groupOrderFeePct??'—'}%</span><Link href="/supplier/billing">{en?'Plans & services':'Csomagok és szolgáltatások'} →</Link></section>
  <section className="portal-stat-grid kpi-grid"><article><BadgeCheck/><span>{en?'Verification':'Ellenőrzés'}</span><strong className="status-text">{p?.verification_level||'UNVERIFIED'}</strong></article><article><ShoppingCart/><span>{en?'Active campaigns':'Aktív kampányok'}</span><strong>{active.length}</strong></article><article><PackageCheck/><span>{en?'MOQ reached':'MOQ teljesítve'}</span><strong>{reached.length}</strong></article><article><PackageCheck/><span>{en?'Completed':'Teljesítve'}</span><strong>{completed}</strong></article></section>
  <section className="portal-link-grid"><Link href="/supplier/group-orders"><ShoppingCart/><div><strong>{en?'Group Order offers':'Group Order ajánlatok'}</strong><span>{en?'Submit one fixed price, one MOQ and one deadline.':'Adj meg egy fix árat, egy MOQ-t és egy határidőt.'}</span></div></Link><Link href="/supplier/messages"><MessageSquare/><div><strong>{en?'Buyer messages':'Vevői üzenetek'}</strong><span>{en?'Private conversations with committed buyers.':'Privát beszélgetések a foglalást leadott vevőkkel.'}</span></div></Link><Link href="/supplier/verification"><BadgeCheck/><div><strong>{en?'Supplier verification':'Beszállítói ellenőrzés'}</strong><span>{en?'Company, VAT, domain and business verification.':'Cég-, VAT-, domain- és üzleti ellenőrzés.'}</span></div></Link><Link href="/supplier/profile"><Building2/><div><strong>{en?'Company profile':'Céges profil'}</strong><span>{en?'Supplier identity, contacts and commercial information.':'Beszállítói adatok, kapcsolatok és kereskedelmi információk.'}</span></div></Link></section>
  </main>;
}
