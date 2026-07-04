import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodes } from './error-codes';

export class AppException extends HttpException {
  public readonly errorCode: string;

  constructor(errorCode: ErrorCode, status: HttpStatus, details?: unknown) {
    const message = ErrorCodes[errorCode];
    super({ code: errorCode, message, details }, status);
    this.errorCode = errorCode;
  }
}
