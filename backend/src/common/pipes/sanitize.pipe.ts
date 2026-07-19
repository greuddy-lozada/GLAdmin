import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

const SKIP_KEYS = new Set([
  'password',
  'token',
  'secret',
  'currentPassword',
  'newPassword',
  'refreshToken',
  'accessToken',
]);

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    return this.sanitize(value);
  }

  private sanitize(value: unknown, key?: string): unknown {
    if (key && SKIP_KEYS.has(key)) return value;

    if (typeof value === 'string') {
      return value.replace(/\0/g, '').trim();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }

    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.sanitize(v, k);
      }
      return out;
    }

    return value;
  }
}
