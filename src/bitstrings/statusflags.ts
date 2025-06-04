
import { BitString } from './bitstring.js'; 

export enum StatusFlagsBit {
  IN_ALARM = 0,
  FAULT = 1,
  OVERRIDDEN = 2,
  OUT_OF_SERVICE = 3,
}

export class StatusFlagsBitString extends BitString<typeof StatusFlagsBit> {
  constructor(...trueBits: StatusFlagsBit[]) { 
    super(4, trueBits);
  }
}

