import { cookies } from 'next/headers';
import { normalizeLocale, type Locale } from './i18n-shared';

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get('bulkpact_locale')?.value);
}
