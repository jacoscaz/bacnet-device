
import type { ErrorCode, ErrorClass } from './enums/errors.js';

export class BACnetError extends Error { 
  errorCode: ErrorCode;
  errorClass: ErrorClass;
  constructor(message: string, errorCode: ErrorCode, errorClass: ErrorClass) {
    super(message);
    this.errorCode = errorCode;
    this.errorClass = errorClass;
  }
}

