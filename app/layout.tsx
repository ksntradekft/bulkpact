import type { Metadata } from 'next';
import './globals.css';
import { getLocale } from '@/lib/i18n-server';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'BulkPact | B2B Group Buying for Europe',
  description: 'A European B2B group-buying platform that combines business demand to reach supplier minimum order quantities.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return <html lang={locale}><body>{children}<CookieConsent locale={locale}/></body></html>;
}
