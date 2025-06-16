
import { BDBitString } from './bitstring.js'; 

import { ObjectTypesSupported as BDSupportedObjectTypesBit } from '@innovation-system/node-bacnet';

export { BDSupportedObjectTypesBit }

/**
 * Implementation of the Protocol_Object_Types_Supported bitstring
 * 
 * This bitstring represents the object types supported by a BACnet device,
 * as defined in the BACnet standard. It is used in the Protocol_Object_Types_Supported
 * property of the Device object.
 * 
 * The BACnet standard defines a large number of possible object types. This implementation
 * allocates 112 bits to accommodate all standard object types, even though the current
 * highest-numbered object type is 59 (LIFT).
 * 
 * @extends BDBitString<typeof BDSupportedObjectTypesBit>
 */
export class BDSupportedObjectTypesBitString extends BDBitString<typeof BDSupportedObjectTypesBit> {
  /**
   * Creates a new SupportedObjectTypes bitstring with the specified bits set to 1
   * 
   * @param trueBits - Array of SupportedObjectTypesBit values representing the object types supported by the device
   */
  constructor(trueBits: BDSupportedObjectTypesBit[]) { 
    super(112, trueBits);
  }
}

