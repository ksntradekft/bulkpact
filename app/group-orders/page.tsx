import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarClock, ShoppingCart, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GroupOrderProgress from '@/components/portal/GroupOrderProgress';
import { displayUnit, formatMoney, formatQuantity, loadGroupOrders } from '@/lib/group-orders';
import { getLocale } from '@/lib/i18n-server';
import { translateGroupOrders } from '@/lib/dynamic-translations';

export const dynamic='force-dynamic';

function deadlineLabel(value:string|null, en:boolean){
  if(!value)return en?'No fixed deadline':'Nincs fix határidő';
  const d=new Date(value);if(!Number.isFinite(d.getTime()))return '—';
  return new Intl.DateTimeFormat(en?'en-GB':'hu-HU',{year:'numeric',month:'short',day:'numeric'}).format(d);
}

export default async function Page(){
  const locale=await getLocale();const en=locale==='en';
  const raw=await loadGroupOrders({publicOnly:true}).catch(()=>[]);
  const translated=await translateGroupOrders(raw,locale).catch(()=>raw);
  const joinable=translated.filter(order=>['OPEN','FILLED'].includes(order.status));
  const now=Date.now();
  const items=[...joinable].sort((a,b)=>{const af=a.featured_until&&new Date(a.featured_until).getTime()>now?1:0,bf=b.featured_until&&new Date(b.featured_until).getTime()>now?1:0;return bf-af||b.fill_percentage-a.fill_percentage});
  return <><Header/><main>
    <section className="subhero bp-market-hero"><div className="container"><p className="eyebrow">BULKPACT MARKETPLACE</p><h1>{en?'Fixed-price bulk deals. MOQ reached together.':'Fix árú nagy tételes ajánlatok. Az MOQ-t együtt érjük el.'}</h1><p className="hero-lead">{en?'Every campaign has one supplier price and one minimum order quantity. Reserve the part your business needs; the order proceeds when combined commitments reach the MOQ.':'Minden kampánynak egyetlen beszállítói ára és egyetlen minimum rendelési mennyisége van. Foglald le a számodra szükséges részt; a rendelés akkor indul el, amikor a közös foglalások elérik az MOQ-t.'}</p><div className="hero-actions"><Link href="/buyer/register" className="button">{en?'Register as buyer':'Vevői regisztráció'} <ArrowRight size={17}/></Link><Link href="/supplier/register" className="button button-ghost">{en?'Submit supplier offer':'Beszállítói ajánlat'}</Link></div></div></section>
    <section className="section"><div className="container">
      <div className="bp-market-rule"><strong>{en?'Simple rule':'Egyszerű szabály'}</strong><span>{en?'Fixed price + fixed MOQ + deadline. If the MOQ is reached, the deal proceeds. If it is not reached, it does not.':'Fix ár + fix MOQ + határidő. Ha összegyűlik az MOQ, az ügylet elindul. Ha nem, nem jön létre.'}</span></div>
      <div className="section-heading"><div><p className="eyebrow">{en?'ACTIVE GROUP ORDERS':'AKTÍV GROUP ORDEREK'}</p><h2>{en?'Open opportunities':'Nyitott ajánlatok'}</h2></div><p>{en?'Registered buyers can submit and update commitments from their dashboard.':'A regisztrált vevők a saját felületükön adhatják le és módosíthatják foglalásukat.'}</p></div>
      {items.length===0?<div className="empty-state public-empty-state"><ShoppingCart/><h3>{en?'No public Group Orders are open right now.':'Jelenleg nincs nyitott nyilvános Group Order.'}</h3><p>{en?'Approved supplier deals will appear here.':'A jóváhagyott beszállítói ajánlatok itt jelennek meg.'}</p></div>:<div className="group-order-grid bp-market-grid">{items.map(order=>{const featured=Boolean(order.featured_until&&new Date(order.featured_until).getTime()>now);return <article className={`group-order-card${featured?' group-order-featured':''}`} key={order.id}>{featured&&<div className="featured-ribbon"><BadgeCheck size={14}/>{en?'FEATURED':'KIEMELT'}</div>}<div className="group-order-card-head"><div><span className={`group-status status-${order.status.toLowerCase()}`}>{order.status}</span><h3>{order.title}</h3><p>{order.brand&&<strong>{order.brand} · </strong>}{order.product_name}</p></div><ShoppingCart/></div>{order.product_description&&<p className="group-description">{order.product_description}</p>}<div className="bp-deal-price"><strong>{formatMoney(order.unit_price,order.currency,locale)} / {displayUnit(order.price_unit,locale)}</strong><span>{en?'FIXED DEAL PRICE':'FIX AJÁNLATI ÁR'}</span></div><GroupOrderProgress reserved={order.reserved_quantity} target={order.target_quantity} unit={order.unit} percentage={order.fill_percentage} locale={locale}/><div className="group-meta-grid"><div><span>MOQ</span><strong>{order.moq_label||formatQuantity(order.target_quantity,order.unit,locale)}</strong></div><div><span>{en?'Committed':'Lefoglalva'}</span><strong>{formatQuantity(order.reserved_quantity,order.unit,locale)}</strong></div><div><span>{en?'Remaining':'Hátralévő'}</span><strong>{formatQuantity(order.remaining_quantity,order.unit,locale)}</strong></div><div><span>{en?'Minimum join':'Minimum csatlakozás'}</span><strong>{formatQuantity(order.min_join_quantity,order.unit,locale)}</strong></div><div><span>{en?'Participants':'Résztvevők'}</span><strong><Users size={15}/> {order.participants}</strong></div><div><span>{en?'Deadline':'Határidő'}</span><strong><CalendarClock size={15}/> {deadlineLabel(order.deadline,en)}</strong></div></div><div className="bp-fixed-price-note">{en?'Price remains fixed for the campaign. Reaching the MOQ determines whether the order proceeds.':'Az ár a kampány teljes ideje alatt fix. Az MOQ elérése dönti el, hogy a rendelés létrejön-e.'}</div><Link href={`/group-orders/${order.id}`} className="button">{en?'View deal & reserve':'Ajánlat és foglalás'}</Link></article>})}</div>}
    </div></section>
  </main><Footer/></>;
}
