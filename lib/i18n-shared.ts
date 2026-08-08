export type Locale = 'hu' | 'en';

export function normalizeLocale(value?: string | null): Locale {
  return value === 'en' ? 'en' : 'hu';
}

export const localeNames: Record<Locale, string> = {
  hu: 'Magyar',
  en: 'English',
};
