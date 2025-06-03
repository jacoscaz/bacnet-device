
import { BACnetError } from '../errors.js';
import { type BACnetValue } from '../value.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '../enums/index.js';

import bacnet, { 
  type BACNetObjectID,
  type BACNetReadAccess,
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type ReadPropertyMultipleContent,
  type WritePropertyContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { BACnetObject } from '../object.js';

import { BACnetListProperty, type BACnetProperty } from '../properties/index.js';

export class BACnetDevice extends BACnetObject {
  
  readonly name: string;
  readonly vendorId: number;
  
  readonly #objects: Map<ObjectType, Map<number, BACnetObject>>;
  readonly #objectList: BACnetValue<ApplicationTag.OBJECTIDENTIFIER>[];
  
  constructor(id: number, name: string, vendorId: number) {
    super(ObjectType.DEVICE, id, name);
    this.#objects = new Map();
    this.#objectList = [];
    this.name = name;
    this.vendorId = vendorId;
    this.addObject(this);
    this.addProperty(new BACnetListProperty(PropertyIdentifier.OBJECT_LIST, ApplicationTag.OBJECTIDENTIFIER, false, this.#objectList));
  }
  
  addObject<T extends BACnetObject>(object: T): T { 
    if (!this.#objects.has(object.identifier.type)) { 
      this.#objects.set(object.identifier.type, new Map());
    }
    if (this.#objects.get(object.identifier.type)!.has(object.identifier.instance)) {
      throw new Error('Cannot register object: duplicate object identifier');
    }
    if (this !== (object as BACnetObject)) {
      object.subscribe('aftercov', this.#onCov);
    }
    this.#objects.get(object.identifier.type)!.set(object.identifier.instance, object);
    this.#objectList.push({ type: ApplicationTag.OBJECTIDENTIFIER, value: object.identifier });
    return object;
  }
  
  #onCov = async (object: BACnetObject, property: BACnetProperty<any, any>, value: BACnetValue | BACnetValue[]) => { 
    await this.trigger('aftercov', object, property, value);
  }

  async ___writeObjectProperty(req: WritePropertyContent): Promise<void> {
    const { payload: { objectId, property, value } } = req;
    const _value = value?.value;
    const _property = value?.property ?? property;
    if (!_value || !_property) {
      return; // TODO: throw
    }
    await this.#handleObjectReq(req, objectId, async (object) => {
      await object.___writeProperty(_property, _value);
    });
  }
  
  ___readObjectProperty = async (req: ReadPropertyContent): Promise<BACnetValue | BACnetValue[]> => {
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
