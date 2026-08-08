import MessagesHub from '@/components/platform/MessagesHub';import { getLocale } from '@/lib/i18n-server';
export default async function Page(){const locale=await getLocale();return <main className="portal-page"><p className="eyebrow">MESSAGES</p><h1>{locale==='en'?'Buyer Group Order communication':'Vevői Group Order kommunikáció'}</h1><MessagesHub role="MANUFACTURER" locale={locale}/></main>}
