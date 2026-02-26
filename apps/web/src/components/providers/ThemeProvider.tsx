'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settings.store';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorTheme, isDarkMode, locale } = useSettingsStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.lang = locale;
  }, [colorTheme, isDarkMode, locale]);

  return <>{children}</>;
}
