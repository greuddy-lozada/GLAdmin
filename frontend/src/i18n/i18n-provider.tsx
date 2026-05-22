'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { translate, translateWithParams } from './i18n.service';

type Locale = 'es' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tp: (key: string, params: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string) => translate(key, locale),
    [locale],
  );

  const tp = useCallback(
    (key: string, params: Record<string, string>) => translateWithParams(key, params, locale),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tp }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
