import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, getErrorInfo } from './error-codes';

export class AppException extends HttpException {
  public readonly errorCode: string;

  constructor(errorCode: ErrorCode, status: HttpStatus, details?: unknown) {
    const { code, message } = getErrorInfo(errorCode);
    super({ code, message, details }, status);
    this.errorCode = code;
  }
}
