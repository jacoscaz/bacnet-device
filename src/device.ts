
import { 
  BACnetError,
} from './utils.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from './enums/index.js';

import bacnet, { 
  type BACNetAppData,
  type BACNetObjectID,
  type BACNetReadAccess,
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type ReadPropertyMultipleContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { BACnetObject, type ObjectCovHandler } from './object.js';

import { BACnetProperty } from './property.js';

export type DeviceCovHandler = (device: BACnetDevice, object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => Promise<void>;

export class BACnetDevice {
  
  readonly id: number;
  readonly name: string;
  readonly vendorId: number;
  
  readonly #onCov: DeviceCovHandler;
  readonly #objects: Map<ObjectType, Map<number, BACnetObject>>;
  readonly #objectList: BACNetAppData[];
  
  constructor(id: number, name: string, vendorId: number, onCov: DeviceCovHandler) {
    this.#onCov = onCov;
    this.#objects = new Map();
    this.#objectList = [];
    this.id = id;
    this.name = name;
    this.vendorId = vendorId;
    
    const device = this.registerObject(ObjectType.DEVICE, id, 'device');
    device.registerProperty(PropertyIdentifier.OBJECT_NAME)
      .setValue({ type: ApplicationTag.CHARACTER_STRING, value: name });
    device.registerProperty(PropertyIdentifier.OBJECT_TYPE)
      .setValue({ type: ApplicationTag.ENUMERATED, value: ObjectType.DEVICE });
    device.registerProperty(PropertyIdentifier.OBJECT_LIST)
      .setValue(this.#objectList);
  }
  
  registerObject(type: ObjectType, instance: number, name: string): BACnetObject {
    if (!this.#objects.has(type)) { 
      this.#objects.set(type, new Map());
    }
    if (this.#objects.get(type)!.has(instance)) {
      throw new Error('Cannot register object: duplicate object identifier');
    }
    const object = new BACnetObject(type, instance, name, this.#onObjectCov);
    this.#objects.get(type)!.set(instance, object);
    this.#objectList.push({ type: ApplicationTag.OBJECTIDENTIFIER, value: object.identifier });
    return object;
  }
  
  ___readProperty = async (req: ReadPropertyContent): Promise<BACNetAppData | BACNetAppData[]> => {
    const { payload: { objectId }, service, invokeId } = req;
    return await this.#handleObjectReq(req, objectId, service!, invokeId!, async (object) => {
      return object.___readProperty(req);
    });
  }
  
  ___readPropertyMultiple = async (properties: ReadPropertyMultipleContent['payload']['properties']): Promise<BACNetReadAccess[]> => {
    const values: BACNetReadAccess[] = [];
    for (const { objectId: { type, instance }, properties: objProperties } of properties) { 
      const object = this.#objects.get(type)?.get(instance);
      if (object) { 
        values.push(await object.___readPropertyMultiple(objProperties));
      }
    }
    return values;
  };
  
  async #handleObjectReq<T extends BaseEventContent>(req: T, objectId: BACNetObjectID, service: number, invokeId: number, cb: (obj: BACnetObject, req: T) => Promise<BACNetAppData | BACNetAppData[]>): Promise<BACNetAppData | BACNetAppData[]> {
    const object = this.#objects.get(objectId.type)?.get(objectId.instance);
    if (object) { 
      return await cb(object, req);
    }
    throw new BACnetError('unknown object', ErrorCode.UNKNOWN_OBJECT, ErrorClass.DEVICE);
  }
  
  #onObjectCov: ObjectCovHandler = async (object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => { 
    return this.#onCov(this, object, property, data);
  };
  
  
  
}
