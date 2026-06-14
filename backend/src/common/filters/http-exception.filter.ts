import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from '../../shared/i18n/i18n.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request: { headers: Record<string, string | string[] | undefined> } =
      ctx.getRequest();
    const lang = this.resolveLang(request);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageKey = 'COMMON.INTERNAL_ERROR';
    let errors: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        messageKey = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        messageKey = (resp.message as string) || exception.message;
        errors = resp.errors || null;

        if (Array.isArray(resp.message)) {
          errors = resp.message;
          messageKey = 'COMMON.VALIDATION_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error('Unhandled non-Error exception', String(exception));
    }

    const message = this.i18n.translate(messageKey, lang);
    const statusCode = status;

    response.status(status).json({
      data: null,
      message,
      errors,
      statusCode,
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
