
import { BDBitString } from './bitstring.js'; 

import { ServicesSupported as BDSupportedServicesBit } from '@innovation-system/node-bacnet';

export { BDSupportedServicesBit }

/**
 * Implementation of the Protocol_Services_Supported bitstring
 * 
 * This bitstring represents the services supported by a BACnet device,
 * as defined in the BACnet standard. It is used in the Protocol_Services_Supported
 * property of the Device object.
 * 
 * The BACnet standard defines a large number of possible services. This implementation
 * allocates 112 bits to accommodate all standard services, including those that might
 * be added in future versions of the standard.
 * 
 * @extends BDBitString<typeof BDSupportedServicesBit>
 */
export class BDSupportedServicesBitString extends BDBitString<typeof BDSupportedServicesBit> {
  /**
   * Creates a new SupportedServices bitstring with the specified bits set to 1
   * 
   * @param trueBits - Array of SupportedServicesBit values representing the services supported by the device
   */
  constructor(trueBits: BDSupportedServicesBit[]) { 
    super(112, trueBits);
  }
}

