import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'ko';
export type ColorTheme = 'default' | 'ocean' | 'forest' | 'amber' | 'rose';

interface SettingsState {
  locale: Locale;
  colorTheme: ColorTheme;
  isDarkMode: boolean;
  setLocale: (locale: Locale) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: 'en',
      colorTheme: 'default',
      isDarkMode: false,
      setLocale: (locale) => set({ locale }),
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
    }),
    {
      name: 'lumen-settings',
    },
  ),
);
