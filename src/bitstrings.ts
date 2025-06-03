
import type { BACNetBitString } from '@innovation-system/node-bacnet';

export type Bit = 1 | 0;

/**
 * Strongly-typed representation of BACnet's StatusFlags data structure.
 */
export class StatusFlagsBitString implements BACNetBitString {
  readonly bitsUsed: 4 = 4;
  readonly value: [Bit, Bit, Bit, Bit];
  constructor(inAlarm: Bit, fault: Bit, overridden: Bit, outOfService: Bit) {
    this.value = [inAlarm, fault, overridden, outOfService];
  }
}
