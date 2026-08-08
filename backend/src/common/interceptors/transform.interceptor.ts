import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Decimal } from '@prisma/client/runtime/library';
import { I18nService } from '../../shared/i18n/i18n.service';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

function convertDecimals(obj: unknown): unknown {
  if (obj instanceof Decimal) return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertDecimals);
  if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertDecimals(value);
    }
    return result;
  }
  return obj;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly i18n: I18nService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request: {
      headers: Record<string, string | string[] | undefined>;
      url?: string;
    } = context.switchToHttp().getRequest();
    const accept = request.headers['accept'];
    const acceptStr = Array.isArray(accept) ? accept.join(',') : (accept ?? '');
    if (
      acceptStr.includes('text/event-stream') ||
      request.url?.includes('/dashboard/stream')
    ) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    const lang = this.resolveLang(context);

    return next.handle().pipe(
      map((body: unknown) => {
        const responseBody = body as Record<string, unknown> | null;

        if (responseBody === null || responseBody === undefined) {
          return { data: null as T };
        }

        if (Array.isArray(responseBody)) {
          return { data: convertDecimals(responseBody) as T };
        }

        if (typeof responseBody === 'object') {
          const {
            data: bodyData,
            message: bodyMsg,
            total,
            page,
            limit,
            ...rest
          } = responseBody;

          const converted = convertDecimals(bodyData ?? rest);

          if (bodyData !== undefined && total !== undefined) {
            const totalPages = limit
              ? Math.ceil((total as number) / (limit as number))
              : 1;
            return {
              data: converted as T,
              meta: { page, limit, total, totalPages },
            };
          }

          if (bodyData !== undefined) {
            const meta: Record<string, unknown> = {};
            if (bodyMsg) {
              meta.message = this.i18n.translate(bodyMsg as string, lang);
            }
            Object.assign(meta, rest);
            return Object.keys(meta).length > 0
              ? { data: converted as T, meta }
              : { data: converted as T };
          }

          if (bodyMsg !== undefined) {
            const meta = {
              message: this.i18n.translate(bodyMsg as string, lang),
            };
            return { data: converted as T, meta };
          }

          return { data: convertDecimals(responseBody) as T };
        }

        return { data: responseBody as T };
      }),
    );
  }

  private resolveLang(context: ExecutionContext): string {
    const request: { headers: Record<string, string | string[] | undefined> } =
      context.switchToHttp().getRequest();
    const acceptLang = request.headers['accept-language'];
    if (typeof acceptLang === 'string' && acceptLang.startsWith('en'))
      return 'en';
    return 'es';
  }
}
