
import type { ErrorCode, ErrorClass } from '@innovation-system/node-bacnet';

/**
 * Represents a BACnet-specific error with associated error code and error class.
 * 
 * BACnet errors include both an error code and an error class to provide detailed
 * information about the nature of the error according to the BACnet specification.
 */
export class BACNetError extends Error { 
  /** The specific BACnet error code */
  code: ErrorCode;
  
  /** The BACnet error class that categorizes this error */
  class: ErrorClass;
  
  /**
   * Creates a new BACnet error instance
   * 
   * @param message - Human-readable error message
   * @param code - BACnet error code from the ErrorCode enum
   * @param classs - BACnet error class from the ErrorClass enum
   */
  constructor(message: string, code: ErrorCode, clss: ErrorClass) {
    super(message);
    this.code = code;
    this.class = clss;
  }
}

