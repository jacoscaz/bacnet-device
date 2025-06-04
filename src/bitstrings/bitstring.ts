
import type { BACNetBitString } from '@innovation-system/node-bacnet';

export type Bit = 1 | 0;

export type EnumType = Record<string, string|number>

export class BitString<E extends EnumType> implements BACNetBitString { 
  readonly bitsUsed: number;
  readonly value: Bit[];
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
 */
export class StatusFlagsBitString implements BACNetBitString {
  readonly bitsUsed: 4 = 4;
  readonly value: [Bit, Bit, Bit, Bit];
  constructor(inAlarm: Bit, fault: Bit, overridden: Bit, outOfService: Bit) {
    this.value = [inAlarm, fault, overridden, outOfService];
  }
}

import { ServicesSupported } from '@innovation-system/node-bacnet';

export class ProtocolServicesSupported implements BACNetBitString {
  readonly bitsUsed: 4 = 4;
  readonly value: [Bit, Bit, Bit, Bit];
  constructor(inAlarm: Bit, fault: Bit, overridden: Bit, outOfService: Bit) {
    this.value = [inAlarm, fault, overridden, outOfService];
  }
}