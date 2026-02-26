import { enUS, ko } from 'date-fns/locale';
import type { Locale } from '@/store/settings.store';

export function getDateLocale(locale: Locale) {
  return { en: enUS, ko }[locale];
}
