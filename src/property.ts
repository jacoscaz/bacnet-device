
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

export type PropertyCovHandler = (property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetProperty {
  
  readonly tag: ApplicationTag;
  readonly identifier: PropertyIdentifier;
  
  #onCov: PropertyCovHandler;
  #value: BACNetAppData;
  
  constructor(identifier: PropertyIdentifier, tag: ApplicationTag, onCov: PropertyCovHandler) {
    this.tag = tag;
    this.identifier = identifier;
    this.#onCov = onCov;
    this.#value = { type: this.tag, value: null };
  }
  
  async getValue() { 
    return this.#value;
  }
  
  async setValue(value: string | number | boolean) { 
    this.#value.value = value;
    await this.#onCov(this, [this.#value]);
  }
  
  async ___readProperty(req: ReadPropertyContent): Promise<BACNetAppData> {
    return { type: this.tag, value: this.getValue() };
  }

}
