import { Injectable } from '@nestjs/common';
import * as en from './locales/en.json';
import * as es from './locales/es.json';

type LocaleMap = { [key: string]: string | Record<string, unknown> };

@Injectable()
export class I18nService {
  private readonly locales: Record<string, LocaleMap> = { en, es };

  translate(key: string, lang: string = 'es'): string {
    const locale = this.locales[lang] || this.locales['es'];
    const keys = key.split('.');
    let result: unknown = locale;

    for (const k of keys) {
      if (
        result &&
        typeof result === 'object' &&
        k in (result as Record<string, unknown>)
      ) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof result === 'string' ? result : key;
  }

  translateWithParams(
    key: string,
    params: Record<string, string>,
    lang: string = 'es',
  ): string {
    let message = this.translate(key, lang);
    for (const [param, value] of Object.entries(params)) {
      message = message.replace(`{{${param}}}`, value);
    }
    return message;
  }
}
