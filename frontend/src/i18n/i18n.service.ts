import es from './locales/es.json';
import en from './locales/en.json';

type LocaleMap = { [key: string]: string | Record<string, unknown> };
type Locale = 'es' | 'en';

const locales: Record<Locale, LocaleMap> = { es, en };

export function translate(key: string, lang: Locale = 'es'): string {
  const locale = locales[lang] || locales.es;
  const keys = key.split('.');
  let result: unknown = locale;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in (result as Record<string, unknown>)) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

export function translateWithParams(
  key: string,
  params: Record<string, string>,
  lang: Locale = 'es',
): string {
  let message = translate(key, lang);
  for (const [param, value] of Object.entries(params)) {
    message = message.replace(`{{${param}}}`, value);
  }
  return message;
}
