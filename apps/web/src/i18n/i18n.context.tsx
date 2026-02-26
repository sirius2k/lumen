'use client';

import React, { createContext, useContext } from 'react';
import { useSettingsStore } from '@/store/settings.store';
import type { Locale } from '@/store/settings.store';
import en from './locales/en.json';
import ko from './locales/ko.json';

const locales: Record<Locale, Record<string, unknown>> = { en, ko };

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((curr: unknown, key: string) => {
    if (curr && typeof curr === 'object') {
      return (curr as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [key, value]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

interface I18nContextValue {
  t: (key: string, params?: Record<string, string | number>) => string;
  tArray: (key: string) => string[];
  locale: Locale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useSettingsStore();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const messages = locales[locale] ?? locales.en;
    const value = getNestedValue(messages, key);
    if (typeof value === 'string') {
      return interpolate(value, params);
    }
    // Fallback to English
    const enValue = getNestedValue(locales.en, key);
    if (typeof enValue === 'string') {
      return interpolate(enValue, params);
    }
    return key;
  };

  const tArray = (key: string): string[] => {
    const messages = locales[locale] ?? locales.en;
    const value = getNestedValue(messages, key);
    if (Array.isArray(value)) return value as string[];
    const enValue = getNestedValue(locales.en, key);
    if (Array.isArray(enValue)) return enValue as string[];
    return [];
  };

  return (
    <I18nContext.Provider value={{ t, tArray, locale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
