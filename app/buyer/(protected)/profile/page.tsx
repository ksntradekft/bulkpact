import AccountPrivacyClient from '@/components/platform/AccountPrivacyClient';
import ProfileForm from '@/components/portal/ProfileForm';
import { getLocale } from '@/lib/i18n-server';
export default async function Page(){const locale=await getLocale();const en=locale==='en';return <main className="portal-page"><p className="eyebrow">{en?'COMPANY DETAILS':'CÉGES ADATOK'}</p><h1>{en?'Buyer profile':'Vevői profil'}</h1><p className="portal-lead">{en?'Contact and company details used for project communication.':'A projektkommunikációhoz használt kapcsolattartói és céges adatok.'}</p><ProfileForm locale={locale}/><AccountPrivacyClient locale={locale}/></main>}
