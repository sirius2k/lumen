'use client';

import * as Popover from '@radix-ui/react-popover';
import { Settings, Sun, Moon } from 'lucide-react';
import { useSettingsStore, type ColorTheme } from '@/store/settings.store';
import { useI18n } from '@/i18n/i18n.context';
import { cn } from '@/lib/utils';

const COLOR_THEMES: { value: ColorTheme; color: string }[] = [
  { value: 'default', color: '#8b5cf6' },
  { value: 'ocean', color: '#3b82f6' },
  { value: 'forest', color: '#22c55e' },
  { value: 'amber', color: '#f59e0b' },
  { value: 'rose', color: '#f43f5e' },
];

export function SettingsPopover() {
  const { locale, colorTheme, isDarkMode, setLocale, setColorTheme, setIsDarkMode } =
    useSettingsStore();
  const { t } = useI18n();

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('settings.title')}
        >
          <Settings className="h-4 w-4" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-64 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95"
        >
          {/* Language */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('settings.language')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLocale('en')}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                  locale === 'en'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLocale('ko')}
                className={cn(
                  'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
                  locale === 'ko'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                한
              </button>
            </div>
          </div>

          {/* Color Theme */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('settings.theme')}
            </p>
            <div className="flex gap-2">
              {COLOR_THEMES.map(({ value, color }) => (
                <button
                  key={value}
                  onClick={() => setColorTheme(value)}
                  title={t(`settings.themes.${value}`)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-all',
                    colorTheme === value
                      ? 'ring-2 ring-offset-2 ring-offset-popover scale-110'
                      : 'hover:scale-105',
                  )}
                  style={{
                    backgroundColor: color,
                    '--tw-ring-color': color,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('settings.darkMode')}
            </p>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors',
                isDarkMode ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                'hover:bg-muted/80',
              )}
            >
              <span>{isDarkMode ? t('settings.darkMode') : t('settings.darkMode')}</span>
              <div
                className={cn(
                  'flex h-5 w-9 items-center rounded-full px-0.5 transition-colors',
                  isDarkMode ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start',
                )}
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-sm">
                  {isDarkMode ? (
                    <Moon className="h-2.5 w-2.5 text-primary" />
                  ) : (
                    <Sun className="h-2.5 w-2.5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </button>
          </div>

          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
