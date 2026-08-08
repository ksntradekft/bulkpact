import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, CheckCircle2, Clock3, PackageCheck, ShieldCheck, ShoppingCart, Store, Truck, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GroupOrderProgress from '@/components/portal/GroupOrderProgress';
import { getLocale } from '@/lib/i18n-server';
import { displayUnit, formatMoney, formatQuantity, loadGroupOrders } from '@/lib/group-orders';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const locale = await getLocale();
  const en = locale === 'en';
  const orders = await loadGroupOrders({ publicOnly: true }).catch(() => []);
  const active = orders.filter(o => ['OPEN','FILLED'].includes(o.status));
  const featured = active.slice(0,3);
  const committed = active.reduce((sum,o)=>sum+o.reserved_quantity,0);
  const participants = active.reduce((sum,o)=>sum+o.participants,0);

  const steps = en ? [
    ['01','Find a deal','Browse fixed-price B2B offers with a clear supplier MOQ.'],
    ['02','Reserve your share','Commit only the pallets, cartons or units your business actually needs.'],
    ['03','Reach the MOQ together','BulkPact combines commitments from independent businesses until the supplier minimum is reached.'],
    ['04','The order goes ahead','Once the MOQ is secured, payment, supplier confirmation and fulfilment move forward.'],
  ] : [
    ['01','Találj egy ajánlatot','Böngéssz fix árú B2B ajánlatokat egyértelmű beszállítói MOQ-val.'],
    ['02','Foglald le a részed','Csak annyi raklapot, kartont vagy darabot vállalj, amennyire ténylegesen szükséged van.'],
    ['03','Érjétek el együtt az MOQ-t','A BulkPact több független vállalkozás foglalását összevonja a beszállítói minimum eléréséig.'],
    ['04','Elindul a rendelés','Ha az MOQ teljesült, indul a fizetés, beszállítói visszaigazolás és a teljesítés.'],
  ];

  return <>
    <Header/>
    <main>
      <section className="bp-hero">
        <div className="bp-grid-overlay"/>
        <div className="container bp-hero-grid">
          <div className="bp-hero-copy">
            <div className="bp-kicker"><span className="live-dot"/> {en?'EUROPEAN B2B GROUP BUYING':'EURÓPAI B2B KÖZÖS BESZERZÉS'}</div>
            <h1>{en?'Buy with the power of a bigger business.':'Vásárolj egy nagyobb cég erejével.'}</h1>
            <p>{en?'BulkPact combines orders from independent businesses so they can reach supplier minimum order quantities together — at one fixed deal price.':'A BulkPact független vállalkozások rendeléseit vonja össze, hogy együtt teljesítsék a beszállítói minimum rendelési mennyiséget — egyetlen fix ajánlati áron.'}</p>
            <div className="hero-actions">
              <Link href="/group-orders" className="button bp-primary">{en?'Browse Group Orders':'Közös rendelések'} <ArrowRight size={17}/></Link>
              <Link href="/buyer/register" className="button button-ghost">{en?'Create buyer account':'Vevői regisztráció'}</Link>
            </div>
            <div className="bp-trust-row">
              <span><ShieldCheck/> {en?'Verified businesses':'Ellenőrzött cégek'}</span>
              <span><PackageCheck/> {en?'Fixed-price deals':'Fix áras ajánlatok'}</span>
              <span><Truck/> {en?'Built for pallet & bulk orders':'Raklapos és bulk rendelésekhez'}</span>
            </div>
          </div>
          <div className="bp-hero-card">
            <div className="bp-card-top"><span>{en?'GROUP ORDER EXAMPLE':'GROUP ORDER PÉLDA'}</span><BadgeCheck/></div>
            <h3>{en?'Wholesale detergent lot':'Nagykereskedelmi mosószer tétel'}</h3>
            <div className="bp-price-row"><strong>€18.50</strong><span>{en?'/ carton · fixed price':'/ karton · fix ár'}</span></div>
            <GroupOrderProgress reserved={43} target={66} unit={en?'pallets':'raklap'} percentage={65.2} locale={locale}/>
            <div className="bp-example-meta"><div><span>MOQ</span><strong>66 {en?'pallets':'raklap'}</strong></div><div><span>{en?'Committed':'Lefoglalva'}</span><strong>43 {en?'pallets':'raklap'}</strong></div><div><span>{en?'Buyers':'Vevők'}</span><strong>17</strong></div><div><span>{en?'Remaining':'Hiányzik'}</span><strong>23 {en?'pallets':'raklap'}</strong></div></div>
            <div className="bp-lock-note"><CheckCircle2/>{en?'60 cartons per pallet in this example. The price does not change; the order proceeds only when the MOQ is reached.':'Ebben a példában 60 karton van egy raklapon. Az ár nem változik; a rendelés csak az MOQ elérésekor indul el.'}</div>
          </div>
        </div>
      </section>

      <section className="bp-proof-strip"><div className="container bp-proof-grid">
        <article><strong>{active.length}</strong><span>{en?'active public Group Orders':'aktív nyilvános Group Order'}</span></article>
        <article><strong>{new Intl.NumberFormat(en?'en-GB':'hu-HU',{maximumFractionDigits:0}).format(committed)}</strong><span>{en?'units currently committed':'egység jelenleg lefoglalva'}</span></article>
        <article><strong>{participants}</strong><span>{en?'buyer participations':'vevői részvétel'}</span></article>
        <article><strong>1</strong><span>{en?'fixed price per campaign':'fix ár kampányonként'}</span></article>
      </div></section>

      <section className="section bp-problem"><div className="container bp-problem-grid">
        <div><p className="eyebrow">{en?'THE PROBLEM':'A PROBLÉMA'}</p><h2>{en?'The good price exists. Your volume is just too small.':'A jó ár létezik. Csak egyedül túl kicsi hozzá a volumened.'}</h2></div>
        <div className="bp-problem-card"><Store/><div><strong>{en?'Small buyer':'Kisebb vevő'}</strong><p>{en?'Needs 1–3 pallets, but the supplier requires a full truck or a high pallet MOQ.':'1–3 raklapra van szüksége, miközben a beszállító teljes kamiont vagy magas raklap-MOQ-t kér.'}</p></div></div>
        <div className="bp-arrow">+</div>
        <div className="bp-problem-card"><Users/><div><strong>{en?'Other businesses':'Más vállalkozások'}</strong><p>{en?'Their smaller requirements are combined into one commercially meaningful order.':'A kisebb igények egy kereskedelmileg értelmezhető nagy rendelésbe állnak össze.'}</p></div></div>
        <div className="bp-arrow">=</div>
        <div className="bp-problem-card bp-problem-result"><Building2/><div><strong>{en?'Supplier MOQ reached':'Beszállítói MOQ teljesítve'}</strong><p>{en?'The supplier gets the volume it wants. Every buyer gets only the quantity it needs.':'A beszállító megkapja a kívánt volument, minden vevő pedig csak a számára szükséges mennyiséget.'}</p></div></div>
      </div></section>

      <section className="section muted"><div className="container">
        <div className="section-heading"><div><p className="eyebrow">{en?'HOW BULKPACT WORKS':'HOGYAN MŰKÖDIK A BULKPACT?'}</p><h2>{en?'One fixed deal. One MOQ. Many buyers.':'Egy fix ajánlat. Egy MOQ. Több vevő.'}</h2></div><p>{en?'No moving price tiers. A campaign has a fixed commercial offer and succeeds only if the minimum is reached.':'Nincs mozgó ársáv. Egy kampánynak fix kereskedelmi ajánlata van, és csak akkor teljesül, ha összegyűlik a minimum.'}</p></div>
        <div className="bp-steps">{steps.map(([n,title,text])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </div></section>

      <section className="section bp-live-section"><div className="container">
        <div className="section-heading"><div><p className="eyebrow">{en?'LIVE MARKETPLACE':'ÉLŐ MARKETPLACE'}</p><h2>{en?'Group Orders businesses can join now.':'Közös rendelések, amelyekhez most lehet csatlakozni.'}</h2></div><Link href="/group-orders" className="service-secondary-link">{en?'View all deals':'Összes ajánlat'} <ArrowRight size={16}/></Link></div>
        {featured.length===0?<div className="bp-empty-live"><ShoppingCart/><h3>{en?'No public campaigns are open yet.':'Még nincs nyitott nyilvános kampány.'}</h3><p>{en?'Supplier offers will appear here as soon as they are approved.':'A jóváhagyott beszállítói ajánlatok itt jelennek meg.'}</p><Link href="/supplier/register" className="button">{en?'Submit a supplier offer':'Beszállítói ajánlat beküldése'}</Link></div>:<div className="group-order-grid bp-home-deals">{featured.map(order=><article className="group-order-card" key={order.id}><div className="group-order-card-head"><div><span className={`group-status status-${order.status.toLowerCase()}`}>{order.status}</span><h3>{order.title}</h3><p>{order.brand&&<strong>{order.brand} · </strong>}{order.product_name}</p></div><ShoppingCart/></div><div className="bp-deal-price"><strong>{formatMoney(order.unit_price,order.currency,locale)} / {displayUnit(order.price_unit,locale)}</strong><span>{en?'fixed deal price':'fix ajánlati ár'}</span></div><GroupOrderProgress reserved={order.reserved_quantity} target={order.target_quantity} unit={order.unit} percentage={order.fill_percentage} locale={locale}/><div className="group-meta-grid"><div><span>MOQ</span><strong>{order.moq_label||formatQuantity(order.target_quantity,order.unit,locale)}</strong></div><div><span>{en?'Remaining':'Hátralévő'}</span><strong>{formatQuantity(order.remaining_quantity,order.unit,locale)}</strong></div><div><span>{en?'Participants':'Résztvevők'}</span><strong>{order.participants}</strong></div><div><span>{en?'Minimum join':'Minimum csatlakozás'}</span><strong>{formatQuantity(order.min_join_quantity,order.unit,locale)}</strong></div></div><Link href={`/group-orders/${order.id}`} className="button">{en?'View deal':'Ajánlat megnyitása'}</Link></article>)}</div>}
      </div></section>

      <section className="section bp-two-sided"><div className="container bp-two-sided-grid">
        <article><div className="bp-role-icon"><Store/></div><p className="eyebrow">{en?'FOR BUYERS':'VEVŐKNEK'}</p><h2>{en?'Stop being punished for buying less.':'Ne azért fizess többet, mert kisebb mennyiséget veszel.'}</h2><p>{en?'Join larger wholesale opportunities without taking the full supplier MOQ on your own.':'Csatlakozz nagy volumenű nagykereskedelmi ajánlatokhoz anélkül, hogy egyedül kellene felvenned a teljes MOQ-t.'}</p><ul><li><CheckCircle2/>{en?'Reserve only what you need':'Csak a szükséges mennyiséget foglald'}</li><li><CheckCircle2/>{en?'See MOQ progress in real time':'Lásd valós időben az MOQ telítettségét'}</li><li><CheckCircle2/>{en?'Track deposit, order and fulfilment status':'Kövesd az előleget, rendelést és teljesítést'}</li></ul><Link href="/buyer/register" className="button">{en?'Join as buyer':'Csatlakozás vevőként'}</Link></article>
        <article className="bp-supplier-card"><div className="bp-role-icon"><Truck/></div><p className="eyebrow">{en?'FOR SUPPLIERS':'BESZÁLLÍTÓKNAK'}</p><h2>{en?'Bring one large offer. Let the network build the order.':'Adj egy nagy ajánlatot. A hálózat összerakja a rendelést.'}</h2><p>{en?'Manufacturers, importers, distributors and wholesalers can submit fixed-price, high-MOQ opportunities to verified business buyers.':'Gyártók, importőrök, disztribútorok és nagykereskedők fix árú, magas MOQ-s ajánlatokat adhatnak ellenőrzött üzleti vevőknek.'}</p><ul><li><CheckCircle2/>{en?'One campaign instead of dozens of cold leads':'Egy kampány több tucat hideg megkeresés helyett'}</li><li><CheckCircle2/>{en?'Live aggregated demand':'Élő aggregált kereslet'}</li><li><CheckCircle2/>{en?'Verification and transaction workflow':'Ellenőrzés és tranzakciós workflow'}</li></ul><Link href="/supplier/register" className="button button-light">{en?'Join as supplier':'Csatlakozás beszállítóként'}</Link></article>
      </div></section>

      <section className="cta-section bp-cta"><div className="container cta-box"><div><p className="eyebrow">BULKPACT</p><h2>{en?'One buyer cannot reach the MOQ. A network can.':'Egy vevő nem éri el az MOQ-t. Egy hálózat igen.'}</h2></div><Link href="/group-orders" className="button button-light">{en?'Browse Group Orders':'Közös rendelések'} <ArrowRight size={17}/></Link></div></section>
    </main>
    <Footer/>
  </>;
}
