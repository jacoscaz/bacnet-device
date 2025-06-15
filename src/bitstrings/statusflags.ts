
import { BDBitString } from './bitstring.js';
import { StatusFlags as BDStatusFlagsBit } from '@innovation-system/node-bacnet';

export { BDStatusFlagsBit }

/**
 * Implementation of the StatusFlags bitstring
 * 
 * The StatusFlags bitstring is a standard BACnet construct that indicates
 * the general status of a BACnet object. It contains four bits that provide
 * a summary of the object's alarm state, fault state, override state, and
 * out-of-service state.
 * 
 * This implementation extends the generic BitString class with the
 * StatusFlagsBit enumeration.
 * 
 * @extends BDBitString<typeof BDStatusFlagsBit>
 */
export class BDStatusFlagsBitString extends BDBitString<typeof BDStatusFlagsBit> {
  /**
   * Creates a new StatusFlags bitstring with the specified bits set to 1
   * 
   * @param trueBits - Array of StatusFlagsBit values representing the positions of bits to set to 1
   */
  constructor(...trueBits: BDStatusFlagsBit[]) { 
    super(4, trueBits);
  }
}

