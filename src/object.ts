
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
  BACNetReadAccess,
} from '@innovation-system/node-bacnet';

import type { 
  ReadPropertyContent,
  ReadPropertyMultipleContent,
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
    this.registerProperty(PropertyIdentifier.OBJECT_TYPE)
      .setValue({ type: ApplicationTag.ENUMERATED, value: type });
    this.registerProperty(PropertyIdentifier.OBJECT_IDENTIFIER)
      .setValue({ type: ApplicationTag.OBJECTIDENTIFIER, value: this.identifier });
    this.registerProperty(PropertyIdentifier.PROPERTY_LIST)
      .setValue(this.#propertyList);
  }
  
  registerProperty(identifier: PropertyIdentifier): BACnetProperty {
    if (this.#properties.has(identifier)) { 
      throw new Error('Cannot register property: duplicate property identifier');
    }
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
  
  async ___readPropertyMultipleAll(): Promise<BACNetReadAccess> { 
    const values: BACNetReadAccess['values'] = [];
    for (const [identifier, property] of this.#properties.entries()) {
      const value = await property.getValue();
      values.push({ property: { id: identifier, index: 0 }, value: Array.isArray(value) ? value : [value] });
    }
    return { objectId: this.identifier, values };
  }
  
  async ___readPropertyMultiple(properties: ReadPropertyMultipleContent['payload']['properties'][number]['properties']): Promise<BACNetReadAccess> { 
    const values: BACNetReadAccess['values'] = [];
    if (properties.length === 1 && properties[0].id === PropertyIdentifier.ALL) { 
      return this.___readPropertyMultipleAll();
    }
    for (const property of properties) {
      if (this.#properties.has(property.id)) {
        const value = await this.#properties.get(property.id)!.getValue();
        values.push({ property, value: Array.isArray(value) ? value : [value] });
      }
    }
    return { objectId: this.identifier, values };
  }
  
  ___onPropertyCov: PropertyCovHandler = async (property: BACnetProperty, data: BACNetAppData[]) => {
    return this.#onCov(this, property, data);
  };
    
}