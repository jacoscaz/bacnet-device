
import type { BACNetAppData } from '@innovation-system/node-bacnet';

import { PropertyIdentifier } from './enums/index.js';

export type PropertyCovHandler = (property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetProperty {
  
  readonly identifier: PropertyIdentifier;
  
  #onCov: PropertyCovHandler;
  #value: BACNetAppData | BACNetAppData[];
  
  constructor(identifier: PropertyIdentifier, onCov: PropertyCovHandler) {
    this.identifier = identifier;
    this.#onCov = onCov;
    this.#value = [];
  }
  
  async getValue(): Promise<BACNetAppData | BACNetAppData[]> {
    return this.#value;
  }
  
  async setValue(value: BACNetAppData | BACNetAppData[]) { 
    this.#value = value;
    await this.#onCov(this, Array.isArray(value) ? value : [value]);
  }

}
