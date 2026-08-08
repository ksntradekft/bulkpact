import Link from 'next/link';
import { Activity, BadgeCheck, Building2, ClipboardList, PackageCheck, ShoppingCart, Users } from 'lucide-react';
import { serviceSelect } from '@/lib/supabase-rest';
import { getLocale } from '@/lib/i18n-server';
export const dynamic='force-dynamic';
export default async function Page(){
  const locale=await getLocale();const en=locale==='en';
  const[users,suppliers,groups,commitments,verification]=await Promise.all([
    serviceSelect<any[]>('profiles?select=id').catch(()=>[]),
    serviceSelect<any[]>('manufacturer_profiles?select=id').catch(()=>[]),
    serviceSelect<any[]>('group_orders?select=id,status,target_quantity').catch(()=>[]),
    serviceSelect<any[]>('group_order_commitments?status=neq.CANCELLED&select=id,group_order_id,quantity').catch(()=>[]),
    serviceSelect<any[]>('manufacturer_profiles?verification_level=neq.UNVERIFIED&select=id').catch(()=>[]),
  ]);
  const open=groups.filter(x=>['OPEN','FILLED','DEPOSIT','LOCKED'].includes(x.status));
  const filled=groups.filter(x=>['FILLED','DEPOSIT','LOCKED','SUPPLIER_CONFIRMED','ORDERED','DISPATCHED','DELIVERED','COMPLETED'].includes(x.status));
  const completed=groups.filter(x=>x.status==='COMPLETED').length;
  const avg=groups.length?Math.round(groups.reduce((sum,g)=>{const r=commitments.filter(c=>c.group_order_id===g.id).reduce((s,c)=>s+Number(c.quantity||0),0);return sum+(Number(g.target_quantity)>0?Math.min(100,r/Number(g.target_quantity)*100):0)},0)/groups.length):0;
  return <main className="portal-page"><p className="eyebrow">{en?'BULKPACT CONTROL':'BULKPACT VEZÉRLŐPULT'}</p><h1>{en?'Group buying operations':'Közös beszerzési operáció'}</h1><p className="portal-lead">{en?'Manage Group Orders, suppliers, buyers, commitments, verification, fulfilment and platform revenue from one control layer.':'Kezeld egy helyről a Group Ordereket, beszállítókat, vevőket, foglalásokat, ellenőrzést, teljesítést és platformbevételt.'}</p>
  <section className="portal-stat-grid kpi-grid"><article><Users/><span>{en?'Users':'Felhasználók'}</span><strong>{users.length}</strong></article><article><Building2/><span>{en?'Suppliers':'Beszállítók'}</span><strong>{suppliers.length}</strong></article><article><ShoppingCart/><span>{en?'Group Orders':'Group Orderek'}</span><strong>{groups.length}</strong></article><article><ShoppingCart/><span>{en?'Open campaigns':'Nyitott kampányok'}</span><strong>{open.length}</strong></article><article><PackageCheck/><span>{en?'MOQ reached':'MOQ teljesítve'}</span><strong>{filled.length}</strong></article><article><Activity/><span>{en?'Average fill':'Átlagos telítettség'}</span><strong>{avg}%</strong></article><article><PackageCheck/><span>{en?'Completed':'Teljesítve'}</span><strong>{completed}</strong></article><article><BadgeCheck/><span>{en?'Verified suppliers':'Ellenőrzött beszállítók'}</span><strong>{verification.length}</strong></article></section>
  <section className="portal-link-grid"><Link href="/admin/group-orders"><ShoppingCart/><div><strong>Group Orders</strong><span>{en?'Create, approve, monitor and close campaigns.':'Kampányok létrehozása, jóváhagyása, monitorozása és lezárása.'}</span></div></Link><Link href="/admin/operations"><ClipboardList/><div><strong>{en?'Operations':'Operáció'}</strong><span>{en?'Tasks, follow-ups and exceptions.':'Feladatok, follow-upok és kivételek.'}</span></div></Link><Link href="/admin/analytics"><Activity/><div><strong>Analytics</strong><span>{en?'GMV, fill rate, conversion and platform activity.':'GMV, fill rate, konverzió és platformaktivitás.'}</span></div></Link><Link href="/admin/registered-manufacturers"><Building2/><div><strong>{en?'Suppliers':'Beszállítók'}</strong><span>{en?'Registered manufacturers, wholesalers and distributors.':'Regisztrált gyártók, nagykereskedők és disztribútorok.'}</span></div></Link><Link href="/admin/verifications"><BadgeCheck/><div><strong>{en?'Verification':'Ellenőrzés'}</strong><span>{en?'Business and supplier trust controls.':'Céges és beszállítói bizalmi ellenőrzések.'}</span></div></Link><Link href="/admin/commercial"><PackageCheck/><div><strong>{en?'Commercial':'Monetizáció'}</strong><span>{en?'Group Order fees, plans and revenue ledger.':'Group Order díjak, csomagok és bevételi ledger.'}</span></div></Link></section>
  </main>;
}
