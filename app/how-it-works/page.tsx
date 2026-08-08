import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { ArrowRight, Banknote, CheckCircle2, PackageCheck, ShoppingCart, Truck, Users } from 'lucide-react';
import { getLocale } from '@/lib/i18n-server';

export default async function Page() {
  const locale=await getLocale();const en=locale==='en';
  const steps=en?[
    ['01','Supplier creates a fixed deal','The offer defines the product, one fixed price, supplier MOQ, minimum buyer commitment, deadline and fulfilment terms.'],
    ['02','BulkPact opens the Group Order','The platform reviews the supplier and campaign before it becomes available to business buyers.'],
    ['03','Businesses reserve smaller shares','Each buyer commits only the pallets, cartons, kilograms or units it needs.'],
    ['04','Commitments are aggregated','The progress bar is based on committed quantity. Interest alone does not count toward the MOQ.'],
    ['05','MOQ reached','Once the supplier minimum is secured, the campaign moves to deposit/payment and supplier confirmation.'],
    ['06','Order and fulfilment','The supplier dispatches directly or through a logistics/cross-dock partner. Buyers track the order until completion.'],
  ]:[
    ['01','A beszállító fix ajánlatot ad','Az ajánlat tartalmazza a terméket, egyetlen fix árat, a beszállítói MOQ-t, a minimum vevői vállalást, a határidőt és a teljesítési feltételeket.'],
    ['02','A BulkPact megnyitja a Group Ordert','A platform ellenőrzi a beszállítót és a kampányt, mielőtt az üzleti vevők számára elérhetővé válik.'],
    ['03','A vállalkozások kisebb részeket foglalnak','Minden vevő csak annyi raklapot, kartont, kilogrammot vagy darabot vállal, amennyire szüksége van.'],
    ['04','A foglalások összeadódnak','A progress bar kizárólag a tényleges commitment alapján nő. A puszta érdeklődés nem számít bele az MOQ-ba.'],
    ['05','Az MOQ teljesül','Ha összegyűlt a beszállítói minimum, a kampány előleg/fizetés és beszállítói visszaigazolás szakaszba lép.'],
    ['06','Rendelés és teljesítés','A beszállító közvetlenül vagy logisztikai/cross-dock partneren keresztül szállít. A vevők végig követhetik a folyamatot.'],
  ];
  return <><Header/><main>
    <section className="subhero bp-market-hero"><div className="container narrow"><p className="eyebrow">{en?'HOW BULKPACT WORKS':'HOGYAN MŰKÖDIK A BULKPACT?'}</p><h1>{en?'One MOQ. Multiple businesses. One completed order.':'Egy MOQ. Több vállalkozás. Egy teljesített rendelés.'}</h1><p>{en?'BulkPact does not change the price as a campaign fills. The supplier sets the deal; the network solves the volume problem.':'A BulkPact nem változtatja az árat a kampány telítődése közben. A beszállító adja az ajánlatot; a hálózat a volumenproblémát oldja meg.'}</p></div></section>
    <section className="section"><div className="container"><div className="process-list bp-process-list">{steps.map(([n,t,d])=><article key={n}><span>{n}</span><div><h3>{t}</h3><p>{d}</p></div></article>)}</div></div></section>
    <section className="section muted"><div className="container bp-rule-grid">
      <article><ShoppingCart/><h3>{en?'Fixed deal price':'Fix ajánlati ár'}</h3><p>{en?'The campaign displays one commercial price. There are no automatic quantity-based price tiers.':'A kampány egyetlen kereskedelmi árat mutat. Nincsenek automatikus mennyiségi ársávok.'}</p></article>
      <article><Users/><h3>{en?'Commitment matters':'A commitment számít'}</h3><p>{en?'Only committed quantities move the campaign toward its MOQ. Interest can be collected separately as demand intelligence.':'Csak a vállalt mennyiség viszi közelebb a kampányt az MOQ-hoz. Az érdeklődés külön keresleti adatként gyűjthető.'}</p></article>
      <article><Banknote/><h3>{en?'Deposit when needed':'Előleg, ha szükséges'}</h3><p>{en?'High-value campaigns can require a deposit before commitments are fully locked.':'Nagy értékű kampánynál előleg kérhető a foglalások végleges lezárása előtt.'}</p></article>
      <article><Truck/><h3>{en?'No giant warehouse required':'Nem kell óriási saját raktár'}</h3><p>{en?'Direct delivery, cross-docking or 3PL fulfilment can be selected according to the structure of the order.':'A rendelés felépítésétől függően közvetlen szállítás, cross-dock vagy 3PL teljesítés használható.'}</p></article>
    </div></section>
    <section className="section"><div className="container bp-success-box"><PackageCheck/><div><p className="eyebrow">{en?'SUCCESS CONDITION':'SIKERFELTÉTEL'}</p><h2>{en?'66-pallet MOQ means 66 pallets must be committed.':'A 66 raklapos MOQ azt jelenti: 66 raklapot kell ténylegesen lefoglalni.'}</h2><p>{en?'At 65 pallets the campaign is not complete. At 66 pallets the minimum has been reached and the commercial workflow can proceed.':'65 raklapnál a kampány még nem teljes. 66 raklapnál elértük a minimumot, és indulhat a kereskedelmi folyamat.'}</p></div><CheckCircle2/></div></section>
    <section className="cta-section bp-cta"><div className="container cta-box"><div><p className="eyebrow">{en?'START':'INDULÁS'}</p><h2>{en?'See which Group Orders are currently open.':'Nézd meg, mely Group Orderekhez lehet most csatlakozni.'}</h2></div><Link href="/group-orders" className="button button-light">{en?'Browse deals':'Ajánlatok'} <ArrowRight size={17}/></Link></div></section>
  </main><Footer/></>;
}
