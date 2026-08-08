import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BadgeCheck, CalendarClock, CheckCircle2, Package, ShieldCheck, Truck, Users } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GroupOrderProgress from '@/components/portal/GroupOrderProgress';
import GroupOrderQuickJoin from '@/components/portal/GroupOrderQuickJoin';
import { getCurrentSession } from '@/lib/auth-server';
import { deadlinePassed, displayUnit, formatMoney, formatQuantity, loadGroupOrders } from '@/lib/group-orders';
import { getLocale } from '@/lib/i18n-server';
import { translateGroupOrders } from '@/lib/dynamic-translations';

export const dynamic = 'force-dynamic';

function dateLabel(value: string | null, en: boolean) {
  if (!value) return en ? 'No fixed deadline' : 'Nincs fix határidő';
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat(en ? 'en-GB' : 'hu-HU', { dateStyle: 'medium', timeStyle: 'short' }).format(d) : '—';
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale, session] = await Promise.all([params, getLocale(), getCurrentSession().catch(() => null)]);
  const en = locale === 'en';
  const canSeeBuyerOnly = session?.profile.role === 'BUYER' || session?.profile.role === 'ADMIN';
  const raw = await loadGroupOrders({ publicOnly: !canSeeBuyerOnly, buyerId: session?.profile.role === 'BUYER' ? session.user.id : undefined }).catch(() => []);
  const translated = await translateGroupOrders(raw, locale).catch(() => raw);
  const order = translated.find(x => x.id === id);
  if (!order) notFound();
  const currentQuantity = Number(order.my_commitment?.quantity || 0);
  const closed = !['OPEN', 'FILLED'].includes(order.status) || deadlinePassed(order.deadline) || (order.remaining_quantity <= 0 && currentQuantity <= 0);
  const isBuyer = session?.profile.role === 'BUYER';
  return <><Header/><main>
    <section className="subhero bp-detail-hero"><div className="container">
      <Link href="/group-orders" className="service-secondary-link"><ArrowLeft size={16}/> {en ? 'Back to Group Orders' : 'Vissza a közös rendelésekhez'}</Link>
      <div className="bp-detail-title"><div><p className="eyebrow">{order.category || 'B2B GROUP ORDER'}</p><h1>{order.title}</h1><p className="hero-lead">{order.brand && <strong>{order.brand} · </strong>}{order.product_name}</p></div><div className="bp-detail-price"><span>{en ? 'FIXED DEAL PRICE' : 'FIX AJÁNLATI ÁR'}</span><strong>{formatMoney(order.unit_price, order.currency, locale)}</strong><small>{en ? `per ${displayUnit(order.price_unit,locale)}` : `/ ${displayUnit(order.price_unit,locale)}`}</small></div></div>
    </div></section>
    <section className="section"><div className="container bp-detail-layout">
      <div className="bp-detail-main">
        <article className="group-order-card bp-detail-progress-card"><div className="group-order-card-head"><div><span className={`group-status status-${order.status.toLowerCase()}`}>{order.status}</span><h2>{en ? 'MOQ progress' : 'MOQ teljesülés'}</h2></div><Package/></div><GroupOrderProgress reserved={order.reserved_quantity} target={order.target_quantity} unit={order.unit} percentage={order.fill_percentage} locale={locale}/><div className="group-meta-grid"><div><span>MOQ</span><strong>{order.moq_label || formatQuantity(order.target_quantity, order.unit, locale)}</strong></div><div><span>{en ? 'Committed' : 'Lefoglalva'}</span><strong>{formatQuantity(order.reserved_quantity, order.unit, locale)}</strong></div><div><span>{en ? 'Remaining' : 'Hátralévő'}</span><strong>{formatQuantity(order.remaining_quantity, order.unit, locale)}</strong></div><div><span>{en ? 'Minimum participation' : 'Minimum csatlakozás'}</span><strong>{formatQuantity(order.min_join_quantity, order.unit, locale)}</strong></div><div><span>{en ? 'Price units / reservation unit' : 'Áregység / foglalási egység'}</span><strong>{order.price_units_per_order_unit} {displayUnit(order.price_unit,locale)} / {displayUnit(order.unit,locale)}</strong></div><div><span>{en ? 'Participating businesses' : 'Résztvevő vállalkozások'}</span><strong><Users size={15}/> {order.participants}</strong></div><div><span>{en ? 'Deadline' : 'Határidő'}</span><strong><CalendarClock size={15}/> {dateLabel(order.deadline, en)}</strong></div></div></article>
        <section className="bp-detail-section"><p className="eyebrow">{en ? 'THE OFFER' : 'AZ AJÁNLAT'}</p><h2>{en ? 'One price. One minimum. No moving price tiers.' : 'Egy ár. Egy minimum. Nincsenek mozgó ársávok.'}</h2><p>{order.product_description || (en ? 'The supplier has submitted this bulk offer at a fixed commercial price. The order proceeds only if participating businesses collectively reach the required MOQ.' : 'A beszállító ezt a nagy tételes ajánlatot fix kereskedelmi áron adta. A rendelés csak akkor indul el, ha a résztvevő vállalkozások együtt elérik a szükséges MOQ-t.')}</p><div className="bp-rule-list"><span><CheckCircle2/> {en ? 'Fixed campaign price' : 'Fix kampányár'}</span><span><CheckCircle2/> {en ? 'Commitments count toward MOQ' : 'A foglalások beleszámítanak az MOQ-ba'}</span><span><CheckCircle2/> {en ? 'No order if the MOQ is not reached' : 'Nincs rendelés, ha az MOQ nem teljesül'}</span></div></section>
        <section className="bp-detail-section"><p className="eyebrow">{en ? 'FULFILMENT' : 'TELJESÍTÉS'}</p><div className="bp-info-cards"><article><Truck/><span>{en ? 'Destination market' : 'Célpiac'}</span><strong>{order.destination_country || '—'}</strong></article><article><ShieldCheck/><span>{en ? 'Campaign visibility' : 'Kampány láthatósága'}</span><strong>{order.visibility === 'PUBLIC' ? (en ? 'Public' : 'Nyilvános') : (en ? 'Registered buyers' : 'Regisztrált vevők')}</strong></article><article><BadgeCheck/><span>{en ? 'Estimated landed price' : 'Becsült landed ár'}</span><strong>{formatMoney(order.estimated_landed_unit, order.currency, locale)} / {displayUnit(order.price_unit,locale)}</strong></article></div></section>
      </div>
      <aside className="bp-detail-aside"><GroupOrderQuickJoin id={order.id} minJoin={order.min_join_quantity} remaining={order.remaining_quantity} unit={order.unit} locale={locale} isBuyer={Boolean(isBuyer)} closed={closed} currentQuantity={currentQuantity}/><div className="bp-side-note"><strong>{en ? 'Important' : 'Fontos'}</strong><p>{en ? 'A reservation is a business commitment. Final payment, delivery and cancellation terms are governed by the campaign terms shown before confirmation.' : 'A foglalás üzleti kötelezettségvállalás. A végleges fizetési, szállítási és lemondási feltételeket a megerősítés előtt megjelenő kampányfeltételek szabályozzák.'}</p></div></aside>
    </div></section>
  </main><Footer/></>;
}
