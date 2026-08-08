import AdminGroupOrdersClient from '@/components/portal/AdminGroupOrdersClient';
import { getLocale } from '@/lib/i18n-server';
export const dynamic='force-dynamic';
export default async function Page(){const locale=await getLocale();const en=locale==='en';return <main className="portal-page"><p className="eyebrow">{en?'GROUP BUYING':'KÖZÖS BESZERZÉS'}</p><h1>{en?'MOQ sharing control':'MOQ megosztó'}</h1><p className="portal-lead">{en?'Create high-MOQ campaigns, review supplier offers and follow the fill rate in real time.':'Hozz létre magas minimumrendelésű kampányokat, kezeld a gyártók és nagykereskedők ajánlatait, és kövesd valós időben a rendelési telítettséget.'}</p><AdminGroupOrdersClient locale={locale}/></main>}
