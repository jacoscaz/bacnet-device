
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
  BACnetScalarProperty,
  BACnetListProperty,
  type BACnetProperty,
} from './property.js';



export interface BACnetObjectEvents { 
  pre_cov: [object: BACnetObject, property: BACnetProperty, nextValue: BACnetValue | BACnetValue[]],
  post_cov: [object: BACnetObject, property: BACnetProperty, newValue: BACnetValue | BACnetValue[]],
}

export class BACnetObject extends Evented<BACnetObjectEvents> { 
  
  readonly identifier: BACNetObjectID;
  readonly #propertyList: BACnetValue[];
  
  #properties: Map<PropertyIdentifier, BACnetProperty>;
  
  constructor(type: ObjectType, instance: number, name: string) {
    super();
    this.identifier = Object.freeze({ type, instance });
    this.#properties = new Map();
    this.#propertyList = [];
    
    this.addProperty(new BACnetScalarProperty(PropertyIdentifier.OBJECT_NAME, ApplicationTag.CHARACTER_STRING, false, name));
    this.addProperty(new BACnetScalarProperty(PropertyIdentifier.OBJECT_TYPE, ApplicationTag.ENUMERATED, false, type));
    this.addProperty(new BACnetScalarProperty(PropertyIdentifier.OBJECT_IDENTIFIER, ApplicationTag.OBJECTIDENTIFIER, false, this.identifier));
    this.addProperty(new BACnetListProperty(PropertyIdentifier.PROPERTY_LIST, false, this.#propertyList));
  }
  
  addProperty<T extends BACnetProperty>(property: T): T { 
    if (this.#properties.has(property.identifier)) { 
      throw new Error('Cannot register property: duplicate property identifier');
    }
    this.#properties.set(property.identifier, property);
    this.#propertyList.push({ type: ApplicationTag.ENUMERATED, value: property.identifier });
    property.subscribe('pre_cov', this.#onPropertyPreCov);
    property.subscribe('post_cov', this.#onPropertyPostCov);
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
      values.push({ property: { id: identifier, index: 0 }, value: await property.___readValueAsList() });
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
        values.push({ property, value: await this.#properties.get(property.id)!.___readValueAsList() });
      }
    }
    return { objectId: this.identifier, values };
  }
  
  
  
  #onPropertyPreCov = async (property: BACnetProperty, nextValue: BACnetValue | BACnetValue[]) => { 
    await this.trigger('pre_cov', this, property, nextValue);
  };
  
  #onPropertyPostCov = async (property: BACnetProperty, nextValue: BACnetValue | BACnetValue[]) => { 
    await this.trigger('post_cov', this, property, nextValue);
  };
  


  

    
}