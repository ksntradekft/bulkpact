'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LoaderCircle, ShoppingCart } from 'lucide-react';
import type { Locale } from '@/lib/i18n-shared';

async function bodyOf(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { error: text }; }
}

export default function GroupOrderQuickJoin({
  id,
  minJoin,
  remaining,
  unit,
  locale = 'hu',
  isBuyer,
  closed,
  currentQuantity = 0,
}: {
  id: string;
  minJoin: number;
  remaining: number;
  unit: string;
  locale?: Locale;
  isBuyer: boolean;
  closed: boolean;
  currentQuantity?: number;
}) {
  const en = locale === 'en';
  const t = (hu: string, eng: string) => en ? eng : hu;
  const available = remaining + Math.max(0, currentQuantity);
  const initial = currentQuantity > 0 ? currentQuantity : Math.min(Math.max(minJoin, 0.001), Math.max(available, minJoin));
  const [quantity, setQuantity] = useState(String(initial));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isBuyer) {
    return <div className="bp-quick-join bp-quick-join-login">
      <h3>{t('Csatlakoznál ehhez a rendeléshez?', 'Want to join this order?')}</h3>
      <p>{t('A foglaláshoz üzleti vevői fiók szükséges.', 'A business buyer account is required to reserve quantity.')}</p>
      <div className="hero-actions">
        <Link className="button" href={`/buyer/login?next=${encodeURIComponent(`/group-orders/${id}`)}`}>{t('Belépés vevőként', 'Log in as buyer')}</Link>
        <Link className="button button-ghost" href="/buyer/register">{t('Vevői regisztráció', 'Create buyer account')}</Link>
      </div>
    </div>;
  }

  async function reserve() {
    setBusy(true); setError(''); setMessage('');
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < minJoin || q > available) {
      setBusy(false);
      setError(t(`A mennyiség ${minJoin} és ${available} ${unit} között lehet.`, `Quantity must be between ${minJoin} and ${available} ${unit}.`));
      return;
    }
    const response = await fetch(`/api/group-orders/${id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: q, note }),
    });
    const data = await bodyOf(response);
    if (!response.ok) setError(data.error || t('A foglalás sikertelen.', 'Reservation failed.'));
    else {
      setMessage(t('A mennyiséget lefoglaltuk. A foglalás beleszámít az MOQ-ba.', 'Quantity reserved. Your commitment now counts toward the MOQ.'));
      setTimeout(() => window.location.reload(), 800);
    }
    setBusy(false);
  }

  return <div className="bp-quick-join">
    <div><p className="eyebrow">{t('FOGLALÁS', 'RESERVATION')}</p><h3>{closed ? t('A kampány jelenleg nem fogad foglalást', 'This campaign is not accepting reservations') : t('Foglald le a szükséges mennyiséget', 'Reserve the quantity you need')}</h3></div>
    {!closed && <>
      <div className="form-grid">
        <label>{t('Mennyiség', 'Quantity')} ({unit})<input type="number" min={minJoin} max={available} step="0.001" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
        <label>{t('Megjegyzés', 'Note')}<input value={note} onChange={e => setNote(e.target.value)} placeholder={t('Opcionális', 'Optional')} /></label>
      </div>
      <button className="button" disabled={busy || available <= 0} onClick={() => void reserve()}>{busy ? <LoaderCircle className="spin" size={17}/> : <ShoppingCart size={17}/>} {t('Mennyiség lefoglalása', 'Reserve quantity')}</button>
    </>}
    {message && <div className="run-report">{message}</div>}
    {error && <div className="error-box">{error}</div>}
  </div>;
}
