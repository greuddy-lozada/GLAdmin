import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from '../../shared/i18n/i18n.service';

export interface SuccessResponse<T> {
  data: T;
  message: string | null;
  statusCode: number;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponse<T>
> {
  constructor(private readonly i18n: I18nService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<T>> {
    const lang = this.resolveLang(context);

    return next.handle().pipe(
      map((responseBody) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;

        if (responseBody === null || responseBody === undefined) {
          return { data: null as T, message: null, statusCode };
        }

        if (Array.isArray(responseBody)) {
          return { data: responseBody, message: null, statusCode };
        }

        if (
          typeof responseBody === 'object' &&
          'data' in responseBody &&
          Array.isArray(responseBody.data) &&
          'total' in responseBody &&
          'page' in responseBody &&
          'limit' in responseBody
        ) {
          return {
            data: responseBody.data,
            total: responseBody.total,
            page: responseBody.page,
            limit: responseBody.limit,
            message: null,
            statusCode,
          };
        }

        if (
          typeof responseBody === 'object' &&
          'data' in responseBody &&
          'message' in responseBody
        ) {
          const msg = responseBody.message
            ? this.i18n.translate(responseBody.message, lang)
            : null;
          return { data: responseBody.data, message: msg, statusCode };
        }

        if (typeof responseBody === 'object' && 'message' in responseBody) {
          const msg = this.i18n.translate(responseBody.message, lang);
          const { message: _, ...rest } = responseBody;
          return { data: rest as T, message: msg, statusCode };
        }

        return { data: responseBody, message: null, statusCode };
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
