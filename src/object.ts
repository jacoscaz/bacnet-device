
import { BACnetError } from './utils.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from './enums/index.js';

import type { 
  BACNetAppData, 
  BACNetObjectID,
} from '@innovation-system/node-bacnet';

import type { 
  ReadPropertyContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import {
  BACnetProperty,
  type PropertyCovHandler
} from './property.js';

export type ObjectCovHandler = (object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetObject { 
  
  readonly identifier: BACNetObjectID;
  readonly #propertyList: BACNetAppData[];
  
  #onCov: ObjectCovHandler;
  #properties: Map<PropertyIdentifier, BACnetProperty>;
  
  constructor(type: ObjectType, instance: number, name: string, onCov: ObjectCovHandler) {
    this.identifier = Object.freeze({ type, instance });
    this.#onCov = onCov;
    this.#properties = new Map();
    this.#propertyList = [];
    
    this.registerProperty(PropertyIdentifier.OBJECT_NAME)
      .setValue({ type: ApplicationTag.CHARACTER_STRING, value: name });
    this.registerProperty(PropertyIdentifier.OBJECT_IDENTIFIER)
      .setValue({ type: ApplicationTag.OBJECTIDENTIFIER, value: this.identifier });
    this.registerProperty(PropertyIdentifier.PROPERTY_LIST)
      .setValue(this.#propertyList);
  }
  
  registerProperty(identifier: PropertyIdentifier): BACnetProperty { 
    const property = new BACnetProperty(identifier, this.___onPropertyCov);
    this.#properties.set(identifier, property);
    this.#propertyList.push({ type: ApplicationTag.ENUMERATED, value: property.identifier });
    return property;
  }

  async ___readProperty(req: ReadPropertyContent): Promise<BACNetAppData | BACNetAppData[]> {
    const { payload: { property } } = req;
    if (this.#properties.has(property.id as PropertyIdentifier)) { 
      return this.#properties.get(property.id as PropertyIdentifier)!.getValue();
    }
    throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);
  }
  
  ___onPropertyCov: PropertyCovHandler = async (property: BACnetProperty, data: BACNetAppData[]) => {
    return this.#onCov(this, property, data);
  };
    
}