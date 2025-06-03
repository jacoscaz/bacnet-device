
import { Evented } from './evented.js';

import { type BACnetValue } from './value.js';
import { BACnetError } from './errors.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from './enums/index.js';

import type {
  BACNetObjectID,
  BACNetPropertyID,
  BACNetReadAccess,
} from '@innovation-system/node-bacnet';

import type { 
  ReadPropertyContent,
  ReadPropertyMultipleContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import {
  BACnetSingletProperty,
  BACnetListProperty,
  type BACnetProperty,
} from './properties/index.js';
import { ensureArray } from './utils.js';

export interface BACnetObjectEvents { 
  beforecov: [object: BACnetObject, property: BACnetProperty<any, any>, nextValue: BACnetValue | BACnetValue[]],
  aftercov: [object: BACnetObject, property: BACnetProperty<any, any>, newValue: BACnetValue | BACnetValue[]],
}

export class BACnetObject extends Evented<BACnetObjectEvents> { 
  
  readonly identifier: BACNetObjectID;
  readonly #propertyList: BACnetValue<ApplicationTag.ENUMERATED, PropertyIdentifier>[];
  readonly #properties: Map<PropertyIdentifier, BACnetProperty<any, any>>;
  
  constructor(type: ObjectType, instance: number, name: string) {
    super();
    this.identifier = Object.freeze({ type, instance });
    this.#properties = new Map();
    this.#propertyList = [];
    
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.OBJECT_NAME, ApplicationTag.CHARACTER_STRING, false, name));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.OBJECT_TYPE, ApplicationTag.ENUMERATED, false, type));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.OBJECT_IDENTIFIER, ApplicationTag.OBJECTIDENTIFIER, false, this.identifier));
    this.addProperty(new BACnetListProperty(PropertyIdentifier.PROPERTY_LIST, ApplicationTag.ENUMERATED, false, this.#propertyList));
  }
  
  addProperty<T extends BACnetProperty<any, any>>(property: T): T { 
    if (this.#properties.has(property.identifier)) { 
      throw new Error('Cannot register property: duplicate property identifier');
    }
    this.#properties.set(property.identifier, property);
    this.#propertyList.push({ type: ApplicationTag.ENUMERATED, value: property.identifier });
    property.subscribe('beforecov', this.#onPropertyBeforeCov);
    property.subscribe('aftercov', this.#onPropertyAfterCov);
    return property;
  }

  async ___writeProperty(identifier: BACNetPropertyID, value: BACnetValue | BACnetValue[]): Promise<void> {
    const property = this.#properties.get(identifier.id as PropertyIdentifier);
    // TODO: test/validate value before setting it!
    if (property) {
      await property.___writeValue(value);
    } else { 
      throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);    
    }
  }
  
  async ___readProperty(req: ReadPropertyContent): Promise<BACnetValue | BACnetValue[]> {
    const { payload: { property } } = req;
    if (this.#properties.has(property.id as PropertyIdentifier)) { 
      return this.#properties.get(property.id as PropertyIdentifier)!
        .___readValue();
    }
    throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);
  }
  
  async ___readPropertyMultipleAll(): Promise<BACNetReadAccess> { 
    const values: BACNetReadAccess['values'] = [];
    for (const [identifier, property] of this.#properties.entries()) {
      values.push({ property: { id: identifier, index: 0 }, value: ensureArray(property.___readValue()) });
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
        values.push({ property, value: ensureArray(this.#properties.get(property.id)!.___readValue()) });
      }
    }
    return { objectId: this.identifier, values };
  }
  
  #onPropertyBeforeCov = async (property: BACnetProperty<any, any>, nextValue: BACnetValue | BACnetValue[]) => { 
    await this.trigger('beforecov', this, property, nextValue);
  };
  
  #onPropertyAfterCov = async (property: BACnetProperty<any, any>, nextValue: BACnetValue | BACnetValue[]) => { 
    await this.trigger('aftercov', this, property, nextValue);
  };
    
}