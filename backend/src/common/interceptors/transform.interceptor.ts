import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from '../../shared/i18n/i18n.service';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
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
    const lang = this.resolveLang(context);

    return next.handle().pipe(
      map((body: unknown) => {
        const responseBody = body as Record<string, unknown> | null;

        if (responseBody === null || responseBody === undefined) {
          return { data: null as T };
        }

        if (Array.isArray(responseBody)) {
          return { data: responseBody as T };
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

          if (bodyData !== undefined && total !== undefined) {
            const totalPages = limit
              ? Math.ceil((total as number) / (limit as number))
              : 1;
            return {
              data: bodyData as T,
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
              ? { data: bodyData as T, meta }
              : { data: bodyData as T };
          }

          if (bodyMsg !== undefined) {
            const meta = {
              message: this.i18n.translate(bodyMsg as string, lang),
            };
            return { data: rest as T, meta };
          }

          return { data: responseBody as T };
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
