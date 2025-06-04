
import { BACnetError } from '../errors.js';
import { type BACnetValue } from '../value.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  Segmentation,
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

import { BACnetArrayProperty, BACnetSingletProperty, type BACnetProperty } from '../properties/index.js';
import { DeviceStatus } from '../enums/index.js';
import { SupportedServicesBit, SupportedServicesBitString } from '../bitstrings/supportedservices.js';
import { SupportedObjectTypesBit, SupportedObjectTypesBitString } from '../bitstrings/supportedobjecttypes.js';


export interface BACnetDeviceOpts {
  /**
   * @see https://kargs.net/BACnet/Foundations2012-BACnetDeviceID.pdf
   */
  instance: number;
  name: string;
  /**
   * @see https://bacnet.org/assigned-vendor-ids/
   */
  vendorId: number;
  vendorName: string;
  modelName: string;  
  firmwareRevision: string;
  applicationSoftwareVersion: string;
  apduLength: number;
  apduTimeout: number;
  apduRetries: number;
  databaseRevision: number;
}

export class BACnetDevice extends BACnetObject {
  
  readonly name: string;
  readonly vendorId: number;
  
  readonly #objects: Map<ObjectType, Map<number, BACnetObject>>;
  readonly #objectList: BACnetValue<ApplicationTag.OBJECTIDENTIFIER>[];
  
  constructor(opts: BACnetDeviceOpts) {
    super(ObjectType.DEVICE, opts.instance, opts.name);
    this.#objects = new Map();
    this.#objectList = [];
    this.name = opts.name;
    this.vendorId = opts.vendorId;
    this.addObject(this);
    this.addProperty(new BACnetArrayProperty(PropertyIdentifier.OBJECT_LIST, ApplicationTag.OBJECTIDENTIFIER, false, this.#objectList));
    this.addProperty(new BACnetArrayProperty(PropertyIdentifier.STRUCTURED_OBJECT_LIST, ApplicationTag.OBJECTIDENTIFIER, false, []));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.SYSTEM_STATUS, ApplicationTag.ENUMERATED, false, DeviceStatus.OPERATIONAL));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.VENDOR_IDENTIFIER, ApplicationTag.UNSIGNED_INTEGER, false, opts.vendorId));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.VENDOR_NAME, ApplicationTag.CHARACTER_STRING, false, opts.vendorName));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.MODEL_NAME, ApplicationTag.CHARACTER_STRING, false, opts.vendorName));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.FIRMWARE_REVISION, ApplicationTag.CHARACTER_STRING, false, opts.vendorName));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.APPLICATION_SOFTWARE_VERSION, ApplicationTag.CHARACTER_STRING, false, opts.vendorName));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.PROTOCOL_VERSION, ApplicationTag.UNSIGNED_INTEGER, false, 1));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.PROTOCOL_REVISION, ApplicationTag.UNSIGNED_INTEGER, false, 14));
    
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.SEGMENTATION_SUPPORTED, ApplicationTag.ENUMERATED, false, Segmentation.NO_SEGMENTATION));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.APDU_LENGTH, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduLength));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.APDU_TIMEOUT, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduLength));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.NUMBER_OF_APDU_RETRIES, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduRetries));
    
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.DATABASE_REVISION, ApplicationTag.UNSIGNED_INTEGER, false, opts.databaseRevision));
    
    // Bindings can be discovered via the "Who-Is" and "I-Am" services. 
    // This property represents a list of static bindings and we can leave it empty.
    this.addProperty(new BACnetArrayProperty(PropertyIdentifier.DEVICE_ADDRESS_BINDING, ApplicationTag.NULL, false, []));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.PROTOCOL_SERVICES_SUPPORTED, ApplicationTag.BIT_STRING, false, new SupportedServicesBitString(
      SupportedServicesBit.WHO_IS,
      SupportedServicesBit.I_AM,
      SupportedServicesBit.READ_PROPERTY,
      SupportedServicesBit.WRITE_PROPERTY,
      SupportedServicesBit.SUBSCRIBE_COV,
      SupportedServicesBit.CONFIRMED_COV_NOTIFICATION,
      SupportedServicesBit.UNCONFIRMED_COV_NOTIFICATION,
    )));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.PROTOCOL_OBJECT_TYPES_SUPPORTED, ApplicationTag.BIT_STRING, false, new SupportedObjectTypesBitString(
      SupportedObjectTypesBit.DEVICE,
      SupportedObjectTypesBit.ANALOG_OUTPUT,
    )));
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
