
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
