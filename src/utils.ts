
import bacnet from '@innovation-system/node-bacnet';

import { ErrorCode, ErrorClass } from './enums/errors.js';

const { 
  default: BACnetClient, 
} = bacnet;

export type BACnetClientType = InstanceType<typeof BACnetClient>;

export class BACnetError extends Error { 
  errorCode: ErrorCode;
  errorClass: ErrorClass;
  constructor(message: string, errorCode: ErrorCode, errorClass: ErrorClass) {
    super(message);
    this.errorCode = errorCode;
    this.errorClass = errorClass;
  }
}
