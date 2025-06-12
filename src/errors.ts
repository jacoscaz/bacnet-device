
/**
 * Error handling module for BACnet devices
 * 
 * This module provides specialized error classes for BACnet-related error conditions.
 * 
 * @module
 */

import type { BDErrorCode, BDErrorClass } from './enums/errors.js';

/**
 * Represents a BACnet-specific error with associated error code and error class.
 * 
 * BACnet errors include both an error code and an error class to provide detailed
 * information about the nature of the error according to the BACnet specification.
 */
export class BDError extends Error { 
  /** The specific BACnet error code */
  errorCode: BDErrorCode;
  
  /** The BACnet error class that categorizes this error */
  errorClass: BDErrorClass;
  
  /**
   * Creates a new BACnet error instance
   * 
   * @param message - Human-readable error message
   * @param errorCode - BACnet error code from the ErrorCode enum
   * @param errorClass - BACnet error class from the ErrorClass enum
   */
  constructor(message: string, errorCode: BDErrorCode, errorClass: BDErrorClass) {
    super(message);
    this.errorCode = errorCode;
    this.errorClass = errorClass;
  }
}

