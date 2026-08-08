import Link from 'next/link';
import { getCurrentSession, portalForRole } from '@/lib/auth-server';
import { getLocale } from '@/lib/i18n-server';
import LanguageSwitcher from './LanguageSwitcher';
import { getPlatformSettings } from '@/lib/platform-settings';

export default async function Header() {
  const [session, locale, settings] = await Promise.all([
    getCurrentSession().catch(() => null),
    getLocale(),
    getPlatformSettings(),
  ]);
  const en = locale === 'en';
  return (
    <header className="site-header bulkpact-header">
      {(locale === 'en' ? settings.maintenance_banner_en : settings.maintenance_banner_hu) && <div className="platform-announcement">{locale === 'en' ? settings.maintenance_banner_en : settings.maintenance_banner_hu}</div>}
      <div className="container nav-wrap">
        <Link href="/" className="brand bulkpact-brand" aria-label="BulkPact home"><span className="bulkpact-mark">BP</span><strong>BulkPact</strong></Link>
        <nav className="desktop-nav" aria-label={en ? 'Main navigation' : 'Fő navigáció'}>
          {settings.group_orders_enabled && <Link href="/group-orders">{en ? 'Group Orders' : 'Közös rendelések'}</Link>}
          <Link href="/how-it-works">{en ? 'How it works' : 'Hogyan működik?'}</Link>
          <Link href="/pricing">{en ? 'Pricing' : 'Árazás'}</Link>
          {settings.registrations_enabled && <Link href="/supplier/register">{en ? 'For suppliers' : 'Beszállítóknak'}</Link>}
          {settings.registrations_enabled && <Link href="/buyer/register">{en ? 'For buyers' : 'Vevőknek'}</Link>}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} compact />
          {session
            ? <Link href={portalForRole(session.profile.role)} className="button button-secondary button-small">{en ? 'Dashboard' : 'Saját felület'}</Link>
            : <Link href="/login" className="header-login">{en ? 'Log in' : 'Belépés'}</Link>}
          <Link href="/group-orders" className="button button-small">{en ? 'Browse deals' : 'Ajánlatok'}</Link>
        </div>
      </div>
    </header>
  );
}
