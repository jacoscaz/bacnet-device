
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
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
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
  
  constructor(id: number, name: string, vendorId: number, onCov: DeviceCovHandler) {
    this.#onCov = onCov;
    this.#objects = new Map();
    this.id = id;
    this.name = name;
    this.vendorId = vendorId;
  }
  
  registerObject(type: ObjectType, instance: number, name: string): BACnetObject {
    const object = new BACnetObject(type, instance, name, this.#onObjectCov);
    if (!this.#objects.has(type)) { 
      this.#objects.set(type, new Map());
    }
    this.#objects.get(type)!.set(instance, object);
    return object;
  }
  
  ___readProperty = async (req: ReadPropertyContent): Promise<BACNetAppData | BACNetAppData[]> => {
    const { payload: { objectId }, service, invokeId } = req;
    let data: BACNetAppData | BACNetAppData[] | null = null;
    if (objectId.type === ObjectType.DEVICE && objectId.instance === this.id) {
      data = this.#readDeviceProperty(req);
    } else {
      data = await this.#handleObjectReq(req, objectId, service!, invokeId!, async (object) => {
        return object.___readProperty(req);
      });
    }
    return data;
  }
  
  async #handleObjectReq<T extends BaseEventContent>(req: T, objectId: BACNetObjectID, service: number, invokeId: number, cb: (obj: BACnetObject, req: T) => Promise<BACNetAppData | BACNetAppData[]>): Promise<BACNetAppData | BACNetAppData[]> {
    const object = this.#objects.get(objectId.type)?.get(objectId.instance);
    if (object) { 
      return await cb(object, req);
    }
    throw new BACnetError('unknown object', ErrorCode.UNKNOWN_OBJECT, ErrorClass.DEVICE);
  }
  
  #readDeviceName = (req: ReadPropertyContent): BACNetAppData => { 
    return { type: ApplicationTag.CHARACTER_STRING, value: this.name };
  };
  
  #readDeviceType = (req: ReadPropertyContent): BACNetAppData => { 
    return { type: ApplicationTag.ENUMERATED, value: ObjectType.DEVICE };
  };
  
  #readDeviceObjectList = (req: ReadPropertyContent): BACNetAppData[] => {
    const list: BACNetAppData[] = []; 
    for (const [type, objects] of this.#objects.entries()) { 
      for (const instance of objects.keys()) {
        list.push({
          type: ApplicationTag.OBJECTIDENTIFIER,
          value: { type, instance },
        });
      }
    }
    return list;
  };
  
  #readDeviceProperty = (req: ReadPropertyContent): BACNetAppData | BACNetAppData[] => {
    const { payload: { property } } = req;
    switch (property.id) {
      case PropertyIdentifier.OBJECT_NAME:
        return this.#readDeviceName(req);
      case PropertyIdentifier.OBJECT_TYPE:
        return this.#readDeviceType(req);
      case PropertyIdentifier.OBJECT_LIST:
        return this.#readDeviceObjectList(req);
      default:
    }
    throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.OBJECT);
  };
  
  #onObjectCov: ObjectCovHandler = async (object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => { 
    return this.#onCov(this, object, property, data);
  };
  
  
  
}
