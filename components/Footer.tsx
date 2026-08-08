import Link from 'next/link';
import { getLocale } from '@/lib/i18n-server';
import LanguageSwitcher from './LanguageSwitcher';

export default async function Footer() {
  const locale = await getLocale();
  const en = locale === 'en';
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || process.env.MAIL_FROM_EMAIL || '';
  return (
    <footer className="footer bulkpact-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-footer bulkpact-brand"><span className="bulkpact-mark">BP</span><strong>BulkPact</strong></div>
          <p>{en ? 'Independent businesses buying with the purchasing power of a larger buyer.' : 'Független vállalkozások közös vásárlóereje egyetlen B2B platformon.'}</p>
          <LanguageSwitcher locale={locale} inverse />
        </div>
        <div>
          <h4>{en ? 'Platform' : 'Platform'}</h4>
          <Link href="/group-orders">{en ? 'Group Orders' : 'Közös rendelések'}</Link>
          <Link href="/how-it-works">{en ? 'How it works' : 'Hogyan működik?'}</Link>
          <Link href="/pricing">{en ? 'Pricing' : 'Árazás'}</Link>
          <Link href="/buyer/register">{en ? 'Buyer registration' : 'Vevői regisztráció'}</Link>
          <Link href="/supplier/register">{en ? 'Supplier registration' : 'Beszállítói regisztráció'}</Link>
        </div>
        <div>
          <h4>{en ? 'Access' : 'Belépés'}</h4>
          <Link href="/buyer/login">{en ? 'Buyer portal' : 'Vevői felület'}</Link>
          <Link href="/supplier/login">{en ? 'Supplier portal' : 'Beszállítói felület'}</Link>
          <Link href="/admin/login">Admin</Link>
          <Link href="/legal/privacy">{en ? 'Privacy' : 'Adatvédelem'}</Link>
          <Link href="/legal/terms">{en ? 'Terms' : 'Feltételek'}</Link>
          {supportEmail && <a href={`mailto:${supportEmail}`}>{supportEmail}</a>}
        </div>
      </div>
      <div className="container footer-bottom">© 2026 BulkPact. {en ? 'All rights reserved.' : 'Minden jog fenntartva.'}</div>
    </footer>
  );
}
