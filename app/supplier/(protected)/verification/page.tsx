import VerificationClient from '@/components/platform/VerificationClient';import { getLocale } from '@/lib/i18n-server';
export default async function Page(){const locale=await getLocale();return <main className="portal-page"><p className="eyebrow">VERIFICATION</p><h1>{locale==='en'?'Supplier verification':'Beszállítói ellenőrzés'}</h1><VerificationClient locale={locale}/></main>}
