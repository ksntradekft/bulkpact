'use client';

import { Globe2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import type { Locale } from '@/lib/i18n-shared';

export default function LanguageSwitcher({
  locale,
  compact = false,
  inverse = false,
}: {
  locale: Locale;
  compact?: boolean;
  inverse?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(nextLocale: Locale) {
    if (nextLocale === locale) return;
    document.cookie = `bulkpact_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = nextLocale;
    startTransition(() => router.refresh());
  }

  return (
    <div className={`language-switcher${compact ? ' language-switcher-compact' : ''}${inverse ? ' language-switcher-inverse' : ''}`} aria-label={locale === 'hu' ? 'Nyelvválasztó' : 'Language selector'}>
      {!compact && <Globe2 size={15} aria-hidden="true" />}
      <button type="button" className={locale === 'hu' ? 'active' : ''} onClick={() => change('hu')} disabled={pending} aria-pressed={locale === 'hu'}>HU</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={locale === 'en' ? 'active' : ''} onClick={() => change('en')} disabled={pending} aria-pressed={locale === 'en'}>EN</button>
    </div>
  );
}
