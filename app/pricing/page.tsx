import Link from 'next/link';
import { Check, Megaphone, ShieldCheck, Truck } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getLocale } from '@/lib/i18n-server';

export default async function Page(){
  const locale=await getLocale();const en=locale==='en';
  const buyerPlans=en?[
    ['FREE','€0','Browse and join standard Group Orders','Standard notifications','Company profile'],
    ['BUSINESS','€29 / month','Everything in Free','Advanced alerts and purchasing history','Fixed 1.5% buyer transaction fee','Buyer demand tools'],
    ['PRO','€79 / month','Everything in Business','Priority access to selected deals','Market intelligence','Multi-user purchasing team','Priority support'],
  ]:[
    ['FREE','€0','Standard Group Orderek böngészése és foglalása','Alap értesítések','Céges profil'],
    ['BUSINESS','€29 / hó','Minden a Free csomagból','Fejlett értesítések és beszerzési előzmények','Fix 1,5% vevői tranzakciós díj','Buyer Demand eszközök'],
    ['PRO','€79 / hó','Minden a Business csomagból','Elsőbbségi hozzáférés kijelölt ajánlatokhoz','Piaci intelligence','Több felhasználós beszerzési csapat','Priority support'],
  ];
  const supplierPlans=en?[
    ['STARTER','€0','Submit Group Orders for review','Company profile','Basic campaign statistics'],
    ['PRO','€99 / month','More simultaneous campaigns','Demand insights','Featured campaign eligibility','Fixed 1.5% supplier platform fee'],
    ['PREMIUM','€199 / month','Everything in Pro','Priority campaign review','Advanced buyer-demand analytics','Premium visibility and support'],
  ]:[
    ['STARTER','€0','Group Order ajánlatok beküldése jóváhagyásra','Céges profil','Alap kampánystatisztika'],
    ['PRO','€99 / hó','Több párhuzamos kampány','Keresleti insightok','Kiemelési lehetőség','Fix 1,5% beszállítói platformdíj'],
    ['PREMIUM','€199 / hó','Minden a Pro csomagból','Elsőbbségi kampányellenőrzés','Fejlett buyer-demand analitika','Prémium láthatóság és support'],
  ];
  return <><Header/><main>
    <section className="subhero pricing-hero bp-market-hero"><div className="container"><p className="eyebrow">{en?'PRICING MODEL':'ÁRAZÁSI MODELL'}</p><h1>{en?'Free access. Revenue when real purchasing happens.':'Ingyenes belépés. Bevétel akkor, amikor valódi beszerzés történik.'}</h1><p>{en?'BulkPact is designed around successful B2B Group Orders: transaction fees can be combined with optional buyer and supplier subscriptions, visibility and logistics services.':'A BulkPact a sikeresen teljesülő B2B Group Orderek köré épül: a tranzakciós díj opcionális vevői és beszállítói előfizetéssel, láthatósággal és logisztikai szolgáltatásokkal egészíthető ki.'}</p></div></section>
    <section className="section"><div className="container pricing-page-stack">
      <section className="pricing-audience"><div className="section-heading compact-heading"><div><p className="eyebrow">{en?'BUYERS':'VEVŐK'}</p><h2>{en?'Buy more efficiently without becoming a wholesaler.':'Hatékonyabb beszerzés anélkül, hogy nagykereskedővé kellene válnod.'}</h2></div></div><div className="pricing-grid monetization-plan-grid">{buyerPlans.map((p,i)=><article className={i===1?'featured':''} key={p[0]}><div className="plan-card-top"><span>{p[0]}</span>{i===1&&<b>{en?'CORE':'FŐ'}</b>}</div><strong className="plan-price">{p[1]}</strong><ul>{p.slice(2).map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul><Link href="/buyer/register" className={i===1?'button button-light':'button'}>{en?'Create buyer account':'Vevői regisztráció'}</Link></article>)}</div></section>
      <section className="pricing-audience"><div className="section-heading compact-heading"><div><p className="eyebrow">{en?'SUPPLIERS':'BESZÁLLÍTÓK'}</p><h2>{en?'Turn large MOQs into accessible campaigns.':'Alakítsd a nagy MOQ-t csatlakozható kampánnyá.'}</h2></div></div><div className="pricing-grid monetization-plan-grid">{supplierPlans.map((p,i)=><article className={i===1?'featured':''} key={p[0]}><div className="plan-card-top"><span>{p[0]}</span>{i===1&&<b>{en?'CORE':'FŐ'}</b>}</div><strong className="plan-price">{p[1]}</strong><ul>{p.slice(2).map(x=><li key={x}><Check size={15}/>{x}</li>)}</ul><Link href="/supplier/register" className={i===1?'button button-light':'button'}>{en?'Register supplier':'Beszállítói regisztráció'}</Link></article>)}</div></section>
      <section className="bp-revenue-model"><article><ShieldCheck/><h3>{en?'Transaction fee':'Tranzakciós díj'}</h3><p>{en?'BulkPact charges 1.5% to the buyer and 1.5% to the supplier when a Group Order proceeds successfully.':'A BulkPact sikeres Group Order esetén 1,5%-ot számít fel a vevőnek és 1,5%-ot a beszállítónak.'}</p></article><article><Megaphone/><h3>{en?'Campaign visibility':'Kampánykiemelés'}</h3><p>{en?'Suppliers can pay for featured placement and targeted buyer reach.':'A beszállítók fizethetnek kiemelt megjelenésért és célzott vevői elérésért.'}</p></article><article><Truck/><h3>{en?'Logistics services':'Logisztikai szolgáltatások'}</h3><p>{en?'Freight, cross-dock and 3PL coordination can create additional service margin.':'Fuvar, cross-dock és 3PL koordináción további szolgáltatási margin képződhet.'}</p></article></section>
      <p className="bp-pricing-note">{en?'Displayed subscription prices are launch-model placeholders and can be changed from the commercial configuration before public launch.':'A megjelenített előfizetési árak induló üzleti modellként szolgálnak, éles indulás előtt a commercial konfigurációban módosíthatók.'}</p>
    </div></section>
  </main><Footer/></>;
}
