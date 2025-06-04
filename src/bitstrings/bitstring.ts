
import type { BACNetBitString } from '@innovation-system/node-bacnet';

/**
 * Represents a single bit value (0 or 1) in a BACnet bitstring
 */
export type Bit = 1 | 0;

/**
 * Type constraint for enumeration types used with BitString
 * 
 * This type represents a mapping of string keys to string or number values,
 * which is the structure of TypeScript enums.
 */
export type EnumType = Record<string, string|number>

/**
 * Generic implementation of a BACnet bitstring
 * 
 * This class provides a strongly-typed representation of BACnet bitstrings,
 * which are used to represent collections of boolean flags in BACnet properties.
 * The class is generic over an enum type that defines the bit positions.
 * 
 * @typeParam E - An enum type that defines the bit positions
 * @implements BACNetBitString
 */
export class BitString<E extends EnumType> implements BACNetBitString { 
  /**
   * The number of bits in this bitstring
   */
  readonly bitsUsed: number;
  
  /**
   * The array of bit values (0 or 1)
   */
  readonly value: Bit[];
  
  /**
   * Creates a new bitstring with the specified bits set to 1
   * 
   * @param bitsUsed - The total number of bits in this bitstring
   * @param trueBits - Array of enum values representing the positions of bits to set to 1
   */
  constructor(bitsUsed: number, trueBits: E[keyof E][]) {
    this.bitsUsed = bitsUsed;
    this.value = new Array(bitsUsed).fill(0);
    for (const index of trueBits) { 
      if (typeof index === 'number') {
        this.value[index] = 1;
      }
    }
  }
}

/**
 * Strongly-typed representation of BACnet's StatusFlags data structure.
 * 
 * The StatusFlags structure represents four standard status flags that are
 * present in many BACnet objects:
 * - IN_ALARM: Indicates the object has an active alarm
 * - FAULT: Indicates the object has detected a fault
 * - OVERRIDDEN: Indicates the property has been overridden by a local action
 * - OUT_OF_SERVICE: Indicates the property is out of service
 * 
 * @implements BACNetBitString
 */
export class StatusFlagsBitString implements BACNetBitString {
  /**
   * StatusFlags always uses 4 bits
   */
  readonly bitsUsed: 4 = 4;
  
  /**
   * The array of 4 bits representing the status flags
   */
  readonly value: [Bit, Bit, Bit, Bit];
  
  /**
   * Creates a new StatusFlags bitstring
   * 
   * @param inAlarm - The IN_ALARM flag value (0 or 1)
   * @param fault - The FAULT flag value (0 or 1)
   * @param overridden - The OVERRIDDEN flag value (0 or 1)
   * @param outOfService - The OUT_OF_SERVICE flag value (0 or 1)
   */
  constructor(inAlarm: Bit, fault: Bit, overridden: Bit, outOfService: Bit) {
    this.value = [inAlarm, fault, overridden, outOfService];
  }
}

import { ServicesSupported } from '@innovation-system/node-bacnet';

/**
 * Represents the Protocol_Services_Supported property in a BACnet Device object
 * 
 * This bitstring indicates which BACnet services are supported by the device.
 * Each bit corresponds to a specific BACnet service as defined in the
 * BACnet standard.
 * 
 * @implements BACNetBitString
 * @deprecated Use SupportedServicesBitString instead
 */
export class ProtocolServicesSupported implements BACNetBitString {
  /**
   * Number of bits used in this implementation
   * @note This appears to be incorrectly set to 4, should be larger to accommodate all services
   */
  readonly bitsUsed: 4 = 4;
  
  /**
   * The array of bits representing the supported services
   * @note This implementation is likely incomplete
   */
  readonly value: [Bit, Bit, Bit, Bit];
  
  /**
   * Creates a new Protocol_Services_Supported bitstring
   * 
   * @param inAlarm - Value for first bit
   * @param fault - Value for second bit
   * @param overridden - Value for third bit
   * @param outOfService - Value for fourth bit
   * @deprecated Use SupportedServicesBitString instead
   */
  constructor(inAlarm: Bit, fault: Bit, overridden: Bit, outOfService: Bit) {
    this.value = [inAlarm, fault, overridden, outOfService];
  }
}