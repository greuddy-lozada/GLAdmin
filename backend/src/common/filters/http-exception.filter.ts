import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { I18nService } from '../../shared/i18n/i18n.service';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly auditLog: AuditLogService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<
      Request & {
        user?: { id?: string; orgId?: string };
        headers: Record<string, string | string[] | undefined>;
      }
    >();
    const lang = this.resolveLang(request);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let code = `HTTP_${status}`;
      let messageKey = 'COMMON.INTERNAL_ERROR';
      let details: unknown = undefined;

      if (typeof exceptionResponse === 'string') {
        messageKey = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        code = (resp.code as string) || code;
        messageKey = (resp.message as string) || exception.message;

        if (Array.isArray(resp.message)) {
          details = (resp.message as string[]).map((m) =>
            this.i18n.translate(m, lang),
          );
          messageKey = 'COMMON.VALIDATION_ERROR';
        } else if (resp.details) {
          details = resp.details;
        }
      }

      if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        this.auditAccessDenied(request, status, code);
      }

      const message = this.i18n.translate(messageKey, lang);

      response.status(status).json({
        error: { code, message, ...(details !== undefined && { details }) },
      });
      return;
    }

    if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unhandled non-Error exception', String(exception));
    }

    const message = this.i18n.translate('COMMON.INTERNAL_ERROR', lang);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: 'INTERNAL_ERROR', message },
    });
  }

  private auditAccessDenied(
    request: Request & {
      user?: { id?: string; orgId?: string };
      headers: Record<string, string | string[] | undefined>;
    },
    status: number,
    code: string,
  ) {
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.ip ||
      null;
    const path = request.originalUrl || request.url;
    const method = request.method;
    const userId = request.user?.id ?? null;
    const organizationId = request.user?.orgId;

    if (!organizationId) {
      this.logger.warn('ACCESS_DENIED', {
        status,
        code,
        method,
        path,
        userId,
        ip,
      });
      return;
    }

    void this.auditLog
      .log({
        organizationId,
        userId,
        action: 'ACCESS_DENIED',
        entity: 'http',
        metadata: { status, code, method, path },
        ipAddress: ip,
      })
      .catch((err: unknown) => {
        this.logger.warn(
          `Failed to audit ACCESS_DENIED: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  private resolveLang(request: {
    headers: Record<string, string | string[] | undefined>;
  }): string {
    const acceptLang = request.headers['accept-language'];
    if (typeof acceptLang === 'string' && acceptLang.startsWith('en'))
      return 'en';
    return 'es';
  }
}
