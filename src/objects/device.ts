
import { 
  BACnetError,
} from '../utils.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '../enums/index.js';

import bacnet, { 
  type BACNetAppData,
  type BACNetObjectID,
  type BACNetReadAccess,
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type ReadPropertyMultipleContent,
  type WritePropertyContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { BACnetObject, type ObjectCovHandler } from '../object.js';

import { BACnetProperty } from '../property.js';

export type DeviceCovHandler = (device: BACnetDevice, object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetDevice extends BACnetObject {
  
  readonly name: string;
  readonly vendorId: number;
  
  readonly #objects: Map<ObjectType, Map<number, BACnetObject>>;
  readonly #objectList: BACNetAppData[];
  
  constructor(id: number, name: string, vendorId: number, onCov: ObjectCovHandler) {
    super(ObjectType.DEVICE, id, name, onCov);
    this.#objects = new Map([[ObjectType.DEVICE, new Map([[id, this]])]]);
    this.#objectList = [{ type: ApplicationTag.OBJECTIDENTIFIER, value: this.identifier }];
    this.name = name;
    this.vendorId = vendorId;
    this.registerProperty(PropertyIdentifier.OBJECT_LIST)
      .setValue(this.#objectList);
  }
  
  registerObject(type: ObjectType, instance: number, name: string): BACnetObject {
    if (!this.#objects.has(type)) { 
      this.#objects.set(type, new Map());
    }
    if (this.#objects.get(type)!.has(instance)) {
      throw new Error('Cannot register object: duplicate object identifier');
    }
    const object = new BACnetObject(type, instance, name, this.___onCov);
    this.#objects.get(type)!.set(instance, object);
    this.#objectList.push({ type: ApplicationTag.OBJECTIDENTIFIER, value: object.identifier });
    return object;
  }
  
  async ___writeObjectProperty(req: WritePropertyContent): Promise<void> {
    const { payload: { objectId, property, value } } = req;
    const _value = value?.value;
    const _property = value?.property ?? property;
    if (!_value || !_property) {
      return; // TODO: throw
    }
    await this.#handleObjectReq(req, objectId, async (object) => {
      await object.___writeProperty(_property, Array.isArray(_value) ? _value : [_value]);
    });
  }
  
  ___readObjectProperty = async (req: ReadPropertyContent): Promise<BACNetAppData[]> => {
    const { payload: { objectId } } = req;
    return await this.#handleObjectReq(req, objectId, async (object) => {
      return object.___readProperty(req);
    });
  }
  
  ___readObjectPropertyMultiple = async (properties: ReadPropertyMultipleContent['payload']['properties']): Promise<BACNetReadAccess[]> => {
    const values: BACNetReadAccess[] = [];
    for (const { objectId: { type, instance }, properties: objProperties } of properties) { 
      const object = this.#objects.get(type)?.get(instance);
      if (object) { 
        values.push(await object.___readPropertyMultiple(objProperties));
      }
    }
    return values;
  };
  
  async #handleObjectReq<T extends BaseEventContent, O>(req: T, objectId: BACNetObjectID, cb: (obj: BACnetObject, req: T) => Promise<O>): Promise<O> {
    const object = this.#objects.get(objectId.type)?.get(objectId.instance);
    if (object) { 
      return await cb(object, req);
    }
    throw new BACnetError('unknown object', ErrorCode.UNKNOWN_OBJECT, ErrorClass.DEVICE);
  }
    
}
