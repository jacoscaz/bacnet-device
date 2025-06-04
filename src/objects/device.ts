
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


/**
 * Configuration options for creating a BACnet Device object
 * 
 * This interface defines the parameters required to initialize a BACnet Device,
 * including identification, vendor information, and protocol configuration.
 */
export interface BACnetDeviceOpts {
  /**
   * Device instance number (0-4194303)
   * Device instance numbers must be unique on a BACnet network
   * @see https://kargs.net/BACnet/Foundations2012-BACnetDeviceID.pdf
   */
  instance: number;
  
  /**
   * The device's name (Object_Name property)
   */
  name: string;
  
  /**
   * Vendor identifier assigned by ASHRAE
   * @see https://bacnet.org/assigned-vendor-ids/
   */
  vendorId: number;
  
  /**
   * The name of the device's vendor
   */
  vendorName: string;
  
  /**
   * The device's model name
   */
  modelName: string;  
  
  /**
   * The device's firmware revision string
   */
  firmwareRevision: string;
  
  /**
   * The device's application software version
   */
  applicationSoftwareVersion: string;
  
  /**
   * Maximum APDU length this device can accept
   */
  apduLength: number;
  
  /**
   * APDU timeout in milliseconds
   */
  apduTimeout: number;
  
  /**
   * Number of APDU retries
   */
  apduRetries: number;
  
  /**
   * Current database revision number
   */
  databaseRevision: number;
}

/**
 * Implements a BACnet Device object
 * 
 * The Device object is a specialized BACnet object that represents the BACnet device itself.
 * It serves as a container for all other BACnet objects and provides device-level properties
 * and services. Each BACnet node hosts exactly one Device object.
 * 
 * According to the BACnet specification, the Device object includes standard properties:
 * - Object_Identifier (automatically added by BACnetObject)
 * - Object_Name (automatically added by BACnetObject) 
 * - Object_Type (automatically added by BACnetObject)
 * - System_Status
 * - Vendor_Name
 * - Vendor_Identifier
 * - Model_Name
 * - Firmware_Revision
 * - Application_Software_Version
 * - Protocol_Version
 * - Protocol_Revision
 * - Protocol_Services_Supported
 * - Protocol_Object_Types_Supported
 * - Object_List
 * - And other properties related to device capabilities and configuration
 * 
 * @extends BACnetObject
 */
export class BACnetDevice extends BACnetObject {
  
  /** The name of this device */
  readonly name: string;
  
  /** The vendor identifier for this device */
  readonly vendorId: number;
  
  /** 
   * Map of all objects in this device, organized by type and instance
   * @private
   */
  readonly #objects: Map<ObjectType, Map<number, BACnetObject>>;
  
  /**
   * List of all object identifiers in this device (for OBJECT_LIST property)
   * @private
   */
  readonly #objectList: BACnetValue<ApplicationTag.OBJECTIDENTIFIER>[];
  
  /**
   * Creates a new BACnet Device object
   * 
   * This constructor initializes a Device object with all required properties
   * according to the BACnet specification, including support for basic BACnet
   * services and object types.
   * 
   * @param opts - Configuration options for this device
   */
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
      SupportedObjectTypesBit.ANALOG_INPUT,
      SupportedObjectTypesBit.ANALOG_OUTPUT,
    )));
  }
  
  /**
   * Adds a BACnet object to this device
   * 
   * This method registers a new BACnet object with the device and adds it to the
   * device's object list. The object must have a unique identifier (type and instance).
   * 
   * @param object - The BACnet object to add to this device
   * @returns The added object
   * @throws Error if an object with the same identifier already exists
   * @typeParam T - The specific BACnet object type
   */
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
  
  /**
   * Handles 'aftercov' events from child BACnet objects
   * 
   * This method propagates Change of Value (COV) events from contained objects
   * to the device's subscribers, allowing for device-wide COV monitoring.
   * 
   * @param object - The object that changed
   * @param property - The property that changed
   * @param value - The new value
   * @private
   */
  #onCov = async (object: BACnetObject, property: BACnetProperty<any, any>, value: BACnetValue | BACnetValue[]) => { 
    await this.trigger('aftercov', object, property, value);
  }

  /**
   * Writes a property value to an object within this device
   * 
   * This internal method is used by the BACnet node to handle WriteProperty
   * requests from the BACnet network. It routes the request to the appropriate
   * object based on the object identifier in the request.
   * 
   * @param req - The WriteProperty request content
   * @returns A promise that resolves when the write operation is complete
   * @throws BACnetError if the object does not exist or the write fails
   * @internal
   */
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
  
  /**
   * Reads a property value from an object within this device
   * 
   * This internal method is used by the BACnet node to handle ReadProperty
   * requests from the BACnet network. It routes the request to the appropriate
   * object based on the object identifier in the request.
   * 
   * @param req - The ReadProperty request content
   * @returns A promise that resolves with the property value
   * @throws BACnetError if the object does not exist or the read fails
   * @internal
   */
  ___readObjectProperty = async (req: ReadPropertyContent): Promise<BACnetValue | BACnetValue[]> => {
    const { payload: { objectId } } = req;
    return await this.#handleObjectReq(req, objectId, async (object) => {
      return object.___readProperty(req);
    });
  }
  
  /**
   * Reads multiple property values from multiple objects within this device
   * 
   * This internal method is used by the BACnet node to handle ReadPropertyMultiple
   * requests from the BACnet network. It collects values from all requested objects
   * and properties in a single operation.
   * 
   * @param properties - Array of object and property identifiers to read
   * @returns A promise that resolves with all requested property values
   * @internal
   */
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
  
  /**
   * Helper method for handling object-specific requests
   * 
   * This private method looks up an object by its identifier and calls the
   * provided callback function with the object if found.
   * 
   * @param req - The request content
   * @param objectId - The identifier of the object to handle the request
   * @param cb - Callback function to execute with the found object
   * @returns A promise that resolves with the result of the callback
   * @throws BACnetError if the object does not exist
   * @private
   * @typeParam T - The type of the request content
   * @typeParam O - The type of the callback result
   */
  async #handleObjectReq<T extends BaseEventContent, O>(req: T, objectId: BACNetObjectID, cb: (obj: BACnetObject, req: T) => Promise<O>): Promise<O> {
    const object = this.#objects.get(objectId.type)?.get(objectId.instance);
    if (object) { 
      return await cb(object, req);
    }
    throw new BACnetError('unknown object', ErrorCode.UNKNOWN_OBJECT, ErrorClass.DEVICE);
  }
    
}
