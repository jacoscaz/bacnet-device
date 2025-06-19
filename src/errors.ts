
import type { ErrorCode, ErrorClass } from '@innovation-system/node-bacnet';

/**
 * Represents a BACnet-specific error with associated error code and error class.
 * 
 * BACnet errors include both an error code and an error class to provide detailed
 * information about the nature of the error according to the BACnet specification.
 */
export class BDError extends Error { 
  /** The specific BACnet error code */
  errorCode: ErrorCode;
  
  /** The BACnet error class that categorizes this error */
  errorClass: ErrorClass;
  
  /**
   * Creates a new BACnet error instance
   * 
   * @param message - Human-readable error message
   * @param errorCode - BACnet error code from the ErrorCode enum
   * @param errorClass - BACnet error class from the ErrorClass enum
   */
  constructor(message: string, errorCode: ErrorCode, errorClass: ErrorClass) {
    super(message);
    this.errorCode = errorCode;
    this.errorClass = errorClass;
  }
}

