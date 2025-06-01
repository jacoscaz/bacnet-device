
import { 
  ApplicationTag,
  PropertyIdentifier,
} from './enums/index.js';

import { 
  type BACNetAppData,
} from '@innovation-system/node-bacnet';

import { 
  type ReadPropertyContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

export type PropertyValueGetter = () => BACNetAppData | BACNetAppData[] | Promise<BACNetAppData | BACNetAppData[]>;

export type PropertyCovHandler = (property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetProperty {
  
  readonly identifier: PropertyIdentifier;
  
  #onCov: PropertyCovHandler;
  #value: BACNetAppData | BACNetAppData[] | PropertyValueGetter;
  
  constructor(identifier: PropertyIdentifier, onCov: PropertyCovHandler) {
    this.identifier = identifier;
    this.#onCov = onCov;
    this.#value = [];
  }
  
  async getValue(): Promise<BACNetAppData | BACNetAppData[]> {
    if (typeof this.#value === 'function') { 
      return this.#value();
    }
    return this.#value;
  }
  
  async setValue(value: BACNetAppData | BACNetAppData[] | PropertyValueGetter) { 
    this.#value = value;
    if (typeof value !== 'function') {
      await this.#onCov(this, Array.isArray(value) ? value : [value]);
    }
  }

}
