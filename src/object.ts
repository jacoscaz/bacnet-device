
import { BACnetError } from './utils.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from './enums/index.js';

import { type BACNetAppData } from '@innovation-system/node-bacnet';

import { 
  type ReadPropertyContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import {
  BACnetProperty,
  type PropertyCovHandler
} from './property.js';

export type ObjectCovHandler = (object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetObject { 
  
  readonly instanceId: number;
  readonly type: ObjectType;
  readonly name: string;
  
  #onCov: ObjectCovHandler;
  #properties: Map<PropertyIdentifier, BACnetProperty>;
  
  constructor(type: ObjectType, instanceId: number, name: string, onCov: ObjectCovHandler) {
    this.type = type;
    this.name = name;
    this.instanceId = instanceId;
    this.#onCov = onCov;
    this.#properties = new Map();
  }
  
  registerProperty(identifier: PropertyIdentifier, tag: ApplicationTag): BACnetProperty { 
    const property = new BACnetProperty(identifier, tag, this.___onPropertyCov);
    this.#properties.set(identifier, property);
    return property;
  }

  async ___readProperty(req: ReadPropertyContent): Promise<BACNetAppData | BACNetAppData[]> {
    const { payload: { property } } = req;
    switch (property.id) { 
      case PropertyIdentifier.PROPERTY_LIST:
        return this.#readPropertyList(req);
      case PropertyIdentifier.OBJECT_NAME:
        return this.#readObjectName(req);
      case PropertyIdentifier.OBJECT_TYPE:
        return this.#readObjectType(req);
      case PropertyIdentifier.OBJECT_IDENTIFIER:
        return this.#readObjectIdentifier(req);
      default:
        if (this.#properties.has(property.id as PropertyIdentifier)) { 
          return this.#properties.get(property.id as PropertyIdentifier)!.___readProperty(req);
        }
    }
    throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);
  }
  
  ___onPropertyCov: PropertyCovHandler = async (property: BACnetProperty, data: BACNetAppData[]) => {
    return this.#onCov(this, property, data);
  };
  
  async #readPropertyList(req: ReadPropertyContent): Promise<BACNetAppData[]> {
    const data: BACNetAppData[] = [];
    for (const property of this.#properties.values()) { 
      data.push({ type: ApplicationTag.ENUMERATED, value: property.identifier });
    }
    return data;
  }
  
  #readObjectName = (req: ReadPropertyContent): BACNetAppData => { 
    return { type: ApplicationTag.CHARACTER_STRING, value: this.name };
  };
  
  #readObjectType = (req: ReadPropertyContent): BACNetAppData => { 
    return { type: ApplicationTag.ENUMERATED, value: this.type };
  };
  
  #readObjectIdentifier = (req: ReadPropertyContent): BACNetAppData => { 
    return { type: ApplicationTag.OBJECTIDENTIFIER, value: this.instanceId };
  };
  
}