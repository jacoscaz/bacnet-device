
import { 
  BDError,
} from '../../errors.js';

import { 
  BDObject,
} from '../generic/object.js';

import { 
  type BACNetClientType,
  isDstInEffect,
  sendConfirmedCovNotification,
  sendUnconfirmedCovNotification,
} from '../../utils.js';

import { 
  BDAbstractProperty,
  BDArrayProperty, 
  BDSingletProperty,
} from '../../properties/index.js';

import bacnet, {
  type BACNetAppData,
  type BACNetObjectID,
  type BACNetReadAccess,
  type ListElementOperationPayload,
  type SubscribeCovPayload,
  type IAMResult,
  type BACNetEventInformation,
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  Segmentation,
  DeviceStatus,
  EventState,
  ServicesSupported,
  ServicesSupportedBitString,
  ObjectTypesSupported,
  ObjectTypesSupportedBitString,
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type ReadPropertyMultipleContent,
  type WritePropertyContent,
  type SubscribeCovContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { isDeepStrictEqual } from 'node:util';

import { 
  type BDDeviceOpts,
  type BDDeviceEvents,
  type BDQueuedCov,
  type BDSubscription,
} from './types.js';

import { device as debug } from '../../debug.js';

import fastq from 'fastq';
import { AsyncEventEmitter } from '../../events.js';

const { default: BACnetClient } = bacnet;


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
 * @extends BDObject
 */
export class BDDevice extends BDObject implements AsyncEventEmitter<BDDeviceEvents> {
  
  /**
   * @see https://bacnet.org/assigned-vendor-ids/
   */
  readonly #vendorId: number;
  
  /** The underlying BACnet client from the bacnet library */
  readonly #client: BACNetClientType;
  
  /** Queue for processing COV notifications */
  readonly #covqueue: fastq.queueAsPromised<BDQueuedCov>;
  
  /** Map of active subscriptions organized by object type and instance */
  readonly #subscriptions: Map<ObjectType, Map<number, Set<BDSubscription>>>;

  
  /** Timer for periodic maintenance tasks */
  #maintenanceInterval: NodeJS.Timer;
  
  /** List of active subscriptions */
  #subscriptionList: BACNetAppData<ApplicationTag.COV_SUBSCRIPTION, BDSubscription>[];
  
  /** 
   * Map of all objects in this device, organized by type and instance
   * @private
   */
  readonly #objects: Map<ObjectType, Map<number, BDObject>>;
  
  /**
   * List of all object identifiers in this device (for OBJECT_LIST property)
   * @private
   */
  readonly #objectList: BACNetAppData<ApplicationTag.OBJECTIDENTIFIER>[];
  
  readonly #knownDevices: Map<number, IAMResult>;
  
  readonly objectList: BDArrayProperty<ApplicationTag.OBJECTIDENTIFIER>;
  readonly structuredObjectList: BDArrayProperty<ApplicationTag.OBJECTIDENTIFIER>;
  readonly protocolVersion: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly protocolRevision: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly protocolServicesSupported: BDSingletProperty<ApplicationTag.BIT_STRING>;
  readonly protocolObjectTypesSupported: BDSingletProperty<ApplicationTag.BIT_STRING>;
  readonly activeCovSubscriptions: BDArrayProperty<ApplicationTag.COV_SUBSCRIPTION>;
  readonly vendorIdentifier: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly vendorName: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly modelName: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly firmwareRevision: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly applicationSoftwareVersion: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly databaseRevision: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly deviceAddressBinding: BDArrayProperty<ApplicationTag.NULL>;
  readonly location: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly serialNumber: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly maxApduLengthAccepted: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly apduTimeout: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly numberOfApduRetries: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly apduSegmentTimeout: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly segmentationSupported: BDSingletProperty<ApplicationTag.ENUMERATED, Segmentation>;
  readonly maxSegmentsAccepted: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly utcOffset: BDSingletProperty<ApplicationTag.SIGNED_INTEGER>;
  readonly localDate: BDSingletProperty<ApplicationTag.DATE>;
  readonly localTime: BDSingletProperty<ApplicationTag.TIME>;
  readonly daylightSavingsStatus: BDSingletProperty<ApplicationTag.BOOLEAN>;
  readonly systemStatus: BDSingletProperty<ApplicationTag.ENUMERATED, DeviceStatus>;
  

  
  /**
   * Creates a new BACnet Device object
   * 
   * This constructor initializes a Device object with all required properties
   * according to the BACnet specification, including support for basic BACnet
   * services and object types.
   * 
   * @param opts - Configuration options for this device
   */
  constructor(opts: BDDeviceOpts) {
    super(ObjectType.DEVICE, opts.instance, opts.name, opts.description);
  
    this.#vendorId = opts.vendorId ?? 0;
    this.#objects = new Map();
    this.#objectList = [];
    this.#knownDevices = new Map();
    this.#subscriptionList = [];
    
    this.#covqueue = fastq.promise(null, this.#covQueueWorker, 1);
    this.#subscriptions = new Map();
    this.#maintenanceInterval = setInterval(this.#updateSubscriptionList, 1_000);
    
    this.#client = new BACnetClient(opts)
      .on('whoHas', this.#onBacnetWhoHas)
      .on('iAm', this.#onBacnetIAm)
      .on('iHave', this.#onBacnetIHave)
      .on('error', this.#onBacnetError)
      .on('readRange', this.#onBacnetReadRange)
      .on('deviceCommunicationControl', this.#onBacnetDeviceCommunicationControl)
      .on('listening', this.#onBacnetListening)
      .on('readProperty', this.#onBacnetReadProperty)
      .on('whoIs', this.#onBacnetWhoIs)
      .on('subscribeCov', this.#onBacnetSubscribeCov)
      .on('subscribeProperty', this.#onBacnetSubscribeProperty)
      .on('readPropertyMultiple', this.#onBacnetReadPropertyMultiple)
      .on('writeProperty', this.#onBacnetWriteProperty)
      .on('addListElement', this.#onBacnetAddListElement)
      .on('removeListElement', this.#onBacnetRemoveListElement)
      .on('getEventInformation', this.#onBacnetGetEventInformation)
      .on('unhandledEvent', this.#onBacnetUnhandledEvent);
    
    this.addObject(this);
    
    // ================== PROPERTIES RELATED TO CHILD OBJECTS =================
    
    this.objectList = this.addProperty(new BDArrayProperty<ApplicationTag.OBJECTIDENTIFIER>(
      PropertyIdentifier.OBJECT_LIST, false, () => this.#objectList));
    
    this.structuredObjectList = this.addProperty(new BDArrayProperty<ApplicationTag.OBJECTIDENTIFIER>(
      PropertyIdentifier.STRUCTURED_OBJECT_LIST, false, () => []));
    
    // ====================== PROTOCOL-RELATED PROPERTIES =====================
    
    this.protocolVersion = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PROTOCOL_VERSION, ApplicationTag.UNSIGNED_INTEGER, false, 1));
    
    this.protocolRevision = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PROTOCOL_REVISION, ApplicationTag.UNSIGNED_INTEGER, false, 24));
    
    const supportedServicesBitString = new ServicesSupportedBitString(
      ServicesSupported.WHO_IS,
      ServicesSupported.I_AM,
      ServicesSupported.READ_PROPERTY,
      ServicesSupported.WRITE_PROPERTY,
      ServicesSupported.SUBSCRIBE_COV,
      ServicesSupported.CONFIRMED_COV_NOTIFICATION,
      ServicesSupported.UNCONFIRMED_COV_NOTIFICATION,
    );
    
    this.protocolServicesSupported = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PROTOCOL_SERVICES_SUPPORTED, ApplicationTag.BIT_STRING, false, supportedServicesBitString));
    
    const supportedObjectTypesBitString = new ObjectTypesSupportedBitString(
      ObjectTypesSupported.DEVICE,
      ObjectTypesSupported.ANALOG_INPUT,
      ObjectTypesSupported.ANALOG_OUTPUT,
    );
    
    this.protocolObjectTypesSupported = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PROTOCOL_OBJECT_TYPES_SUPPORTED, ApplicationTag.BIT_STRING, false, supportedObjectTypesBitString));
    
    // ==================== SUBSCRIPTION-RELATED PROPERTIES ===================
    
    this.activeCovSubscriptions = this.addProperty(new BDArrayProperty<ApplicationTag.COV_SUBSCRIPTION>(
      PropertyIdentifier.ACTIVE_COV_SUBSCRIPTIONS, false, () => this.#updateSubscriptionList()));
    
    // ========================== METADATA PROPERTIES =========================
    
    this.vendorIdentifier = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.VENDOR_IDENTIFIER, ApplicationTag.UNSIGNED_INTEGER, false, this.#vendorId));
    
    this.vendorName = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.VENDOR_NAME, ApplicationTag.CHARACTER_STRING, false, opts.vendorName ?? 'w'));
    
    this.modelName = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MODEL_NAME, ApplicationTag.CHARACTER_STRING, false, opts.modelName));
    
    this.firmwareRevision = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.FIRMWARE_REVISION, ApplicationTag.CHARACTER_STRING, false, opts.firmwareRevision));
    
    this.applicationSoftwareVersion = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.APPLICATION_SOFTWARE_VERSION, ApplicationTag.CHARACTER_STRING, false, opts.applicationSoftwareVersion));
    
    this.databaseRevision = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.DATABASE_REVISION, ApplicationTag.UNSIGNED_INTEGER, false, opts.databaseRevision));
     
    // Bindings can be discovered via the "Who-Is" and "I-Am" services. 
    // This property represents a list of static bindings and we can leave it empty.
    this.deviceAddressBinding = this.addProperty(new BDArrayProperty<ApplicationTag.NULL>(
      PropertyIdentifier.DEVICE_ADDRESS_BINDING, false, []));
    
    // In your device constructor
    this.location = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.LOCATION, ApplicationTag.CHARACTER_STRING, false, opts.location ?? 'w'));
    
    this.serialNumber = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.SERIAL_NUMBER, ApplicationTag.CHARACTER_STRING, false, opts.serialNumber ?? 'w'));
    
    // ======================== APDU-RELATED PROPERTIES =======================
    
    this.maxApduLengthAccepted = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MAX_APDU_LENGTH_ACCEPTED, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduMaxLength ?? 1476));
    
    this.apduTimeout = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.APDU_TIMEOUT, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduTimeout ?? 6000));
    
    this.numberOfApduRetries = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.NUMBER_OF_APDU_RETRIES, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduRetries ?? 3));
    
    this.apduSegmentTimeout = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.APDU_SEGMENT_TIMEOUT, ApplicationTag.UNSIGNED_INTEGER, false, opts.apduSegmentTimeout ?? 2000));
  
    // ======================== SEGMENTATION PROPERTIES =======================

    this.segmentationSupported = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, Segmentation>(
      PropertyIdentifier.SEGMENTATION_SUPPORTED, ApplicationTag.ENUMERATED, false, Segmentation.SEGMENTED_BOTH));
    
    // Accepter values: 2, 4, 8, 16, 32, 64 and 0 for "unspecified"
    this.maxSegmentsAccepted = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MAX_SEGMENTS_ACCEPTED, ApplicationTag.UNSIGNED_INTEGER, false, 16));
    
    // ======================== TIME-RELATED PROPERTIES =======================
    
    this.utcOffset = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.UTC_OFFSET, ApplicationTag.SIGNED_INTEGER, false, (ctx) => ctx.date.getTimezoneOffset() * -1));
    
    this.localDate = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.LOCAL_DATE, ApplicationTag.DATE, false, (ctx) => ctx.date));
    
    this.localTime = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.LOCAL_TIME, ApplicationTag.TIME, false, (ctx) => ctx.date));
    
    this.daylightSavingsStatus = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.DAYLIGHT_SAVINGS_STATUS, ApplicationTag.BOOLEAN, false, (ctx) => isDstInEffect(ctx.date)));
    
    // ======================= STATUS-RELATED PROPERTIES ======================
    
    this.systemStatus = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, DeviceStatus>(
      PropertyIdentifier.SYSTEM_STATUS, ApplicationTag.ENUMERATED, false, DeviceStatus.OPERATIONAL));
    
  }
  
  // ==========================================================================
  //                               PUBLIC METHODS
  // ==========================================================================
  
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
  addObject<T extends BDObject>(object: T): T { 
    if (!this.#objects.has(object.identifier.type)) { 
      this.#objects.set(object.identifier.type, new Map());
    }
    if (this.#objects.get(object.identifier.type)!.has(object.identifier.instance)) {
      throw new Error('Cannot register object: duplicate object identifier');
    }
    object.on('aftercov', this.#onChildAfterCov);
    this.#objects.get(object.identifier.type)!.set(object.identifier.instance, object);
    this.#objectList.push({ type: ApplicationTag.OBJECTIDENTIFIER, value: object.identifier });
    return object;
  }
  
  // ==========================================================================
  //                        INTERNAL HELPER METHODS
  // ==========================================================================
  
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
  async #handleObjectReq<T extends BaseEventContent, O>(req: T, objectId: BACNetObjectID, cb: (obj: BDObject, req: T) => Promise<O>): Promise<O> {
    const object = this.#objects.get(objectId.type)?.get(objectId.instance);
    if (object) { 
      return await cb(object, req);
    }
    throw new BDError('unknown object', ErrorCode.UNKNOWN_OBJECT, ErrorClass.DEVICE);
  }


  /**
   * Handles periodic maintenance of subscriptions
   * 
   * This method runs periodically to clean up expired subscriptions.
   * 
   * @private
   */
  #updateSubscriptionList = () => { 
    const now = Date.now();
    for (const [type, typeSubs] of this.#subscriptions.entries()) { 
      for (const [instance, instanceSubs] of typeSubs.entries()) {
        for (const sub of instanceSubs) { 
          if (sub.expiresAt < now) {
            instanceSubs.delete(sub);
            this.#subscriptionList = this.#subscriptionList.filter(_s => _s.value !== sub);
          } else { 
            sub.timeRemaining = Math.floor((sub.expiresAt - now) / 1000);
          }
        }
        if (instanceSubs.size === 0) {
          typeSubs.delete(instance);
        }
      }
      if (typeSubs.size === 0) { 
        this.#subscriptions.delete(type);
      }
    }
    return this.#subscriptionList;
  };
  
  /**
   * Worker function for processing the COV notification queue
   * 
   * This method processes each COV notification and sends it to all
   * applicable subscribers.
   * 
   * @param cov - The change of value data to process
   * @private
   */
  #covQueueWorker = async (cov: BDQueuedCov) => { 
    const now = Date.now();
    const subscriptions = this.#subscriptions.get(cov.object.identifier.type)?.get(cov.object.identifier.instance);
    if (subscriptions) {
      for (const subscription of subscriptions) {
        // TODO: consider indexing subscriptions by ObjectType, ObjectInstance and PropertyIdentifier 
        //       right now we're stopping at ObjectType, ObjectInstance
        if (cov.property.identifier === subscription.monitoredProperty.id && now < subscription.expiresAt) {
          // TODO: handle list/array properties if monitoredProperty.index is set
          if (subscription.issueConfirmedNotifications) {
            await sendConfirmedCovNotification(this.#client, this, subscription, cov);
            subscription.covIncrement += 1;
          } else {
            subscription.covIncrement += 1;
            await sendUnconfirmedCovNotification(this.#client, this, subscription, cov);
          }
        }
      } 
    }
  };
  
  // ==========================================================================
  //                     LISTENERS FOR CHILD OBJECT EVENTS
  // ==========================================================================
  
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
  #onChildAfterCov = async (object: BDObject, property: BDAbstractProperty<any, any, any>, value: BACNetAppData | BACNetAppData[]) => { 
    await this.#covqueue.push({ object, property, value });
  }


  // ==========================================================================
  //                   LISTENERS FOR BACNET SERVICE EVENTS
  // ==========================================================================
  
  
  /**
   * Handles ReadProperty requests from other BACnet devices
   * 
   * This method processes ReadProperty requests and returns the requested
   * property value or an appropriate error.
   * 
   * @param req - The ReadProperty request content
   * @private
   */
  #onBacnetReadProperty = async (req: ReadPropertyContent) => {
    const { payload: { objectId, property }, address, header, service, invokeId } = req;
    debug('req #%s: readProperty, object %s %s, property %s', invokeId, ObjectType[objectId.type], objectId.instance, PropertyIdentifier[property.id]);
    debug(JSON.stringify(property));
    if (!header) return;
    try {
      const data = await this.#handleObjectReq(req, objectId, async (object) => {
        return object.___readProperty(property);
      });
      this.#client.readPropertyResponse({ address: header.sender.address }, invokeId!, objectId, property, data);
    } catch (err) { 
      debug('error: %s', (err as any).stack);
      if (err instanceof BDError) {
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, err.class, err.code);
      } else { 
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
      }
    }
  }
  
  /**
   * Handles SubscribeCOV requests from other BACnet devices
   * 
   * This method processes subscription requests for COV notifications
   * and either creates a new subscription or updates an existing one.
   * 
   * @param req - The SubscribeCOV request content
   * @private
   */
  #onBacnetSubscribeCov = async (req: SubscribeCovContent) => {
    const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
    debug('new subscription: object %s %s', ObjectType[monitoredObjectId.type], monitoredObjectId.instance);
    if (!header) return;
    let typeSubs = this.#subscriptions.get(monitoredObjectId.type);
    if (!typeSubs) { 
      typeSubs = new Map();
      this.#subscriptions.set(monitoredObjectId.type, typeSubs);
    }
    let instanceSubs = typeSubs.get(monitoredObjectId.instance);
    if (!instanceSubs) { 
      instanceSubs = new Set();
      typeSubs.set(monitoredObjectId.instance, instanceSubs);
    }
    let previous: BDSubscription | null = null;
    for (const sub of instanceSubs) { 
      if (sub.subscriber.address === header.sender.address
        && isDeepStrictEqual(monitoredObjectId, sub.monitoredObjectId)
        && sub.subscriptionProcessId === subscriberProcessId
      ) { 
        previous = sub;
      }
    }
    if (previous) {
      debug('updating previous subscription');
      previous.expiresAt = Date.now() + (lifetime * 1000);
    } else { 
      debug('registering new subscription');
      const sub = {
        subscriptionProcessId: subscriberProcessId,
        issueConfirmedNotifications,
        expiresAt: Date.now() + (lifetime * 1000),
        // TODO: handle value-specific subscriptions when index > 0
        monitoredProperty: { id: PropertyIdentifier.PRESENT_VALUE, index: 0 },
        monitoredObjectId,
        subscriber: header.sender,
        covIncrement: 0,
        timeRemaining: lifetime,
        recipient: { address: [0], network: 0 },
      };
      instanceSubs.add(sub);
      this.#subscriptionList.push({ type: ApplicationTag.COV_SUBSCRIPTION, value: sub });
    }
    this.#client.simpleAckResponse({ address: header.sender.address }, service!, invokeId!);
  };
  
  /**
   * Handles SubscribeCOVProperty requests from other BACnet devices
   * 
   * This method is not fully implemented yet as it requires additional
   * support from the underlying BACnet library.
   * 
   * Implementing onSubscribeCovProperty requires the underlying
   * @innovation-system/node-bacnet library to add support for the
   * full payload of this kind of event, which includes - in addition
   * to the properties of the standard onSubscribeCov event - the 
   * following:
   * - monitored property: reference to the specific property being monitored
   * - covIncrement: (optional) minimum value change required to send cov
   * 
   * @param req - The SubscribeCOVProperty request content
   * @private
   */
  #onBacnetSubscribeProperty = async (req: Omit<BaseEventContent, 'payload'> & { payload: SubscribeCovPayload }) => { 
    debug('new request: subscribeProperty');
    this.#onBacnetUnsupportedService(req);
    // const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
  };
  
  /**
   * Handles WhoIs requests from other BACnet devices
   * 
   * This method responds with an IAm message identifying this device.
   * 
   * @param req - The WhoIs request content
   * @private
   */
  #onBacnetWhoIs = (req: BaseEventContent) => { 
    debug('new request: whoIs');
    const { header } = req;
    if (!header) return;
    this.#client.iAmResponse({ address: header.sender.address }, this.identifier.instance, Segmentation.NO_SEGMENTATION, this.#vendorId);
  }
  
  /**
   * Handles WhoHas requests from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The WhoHas request content
   * @private
   */
  #onBacnetWhoHas = (req: BaseEventContent) => {
    debug('new request: whoHas');
  };
  
  /**
   * Handles IAm notifications from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The IAm notification content
   * @private
   */
  #onBacnetIAm = (req: Omit<BaseEventContent, 'payload'> & { payload: IAMResult }) => {
    debug('new request: iAm');
    const { payload } = req;
    const { deviceId } = payload;
    // TODO: handle duplicate deviceId(s)
    this.#knownDevices.set(deviceId, payload);
  };
  
  /**
   * Handles IHave notifications from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The IHave notification content
   * @private
   */
  #onBacnetIHave = (req: BaseEventContent) => {
    debug('new request: iHave');
    // const { header, service, invokeId } = req;
    // TODO: implement
  };
  
  /**
   * Handles ReadRange requests from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The ReadRange request content
   * @private
   */
  #onBacnetReadRange = (req: BaseEventContent) => {
    debug('new request: readRange');
    this.#onBacnetUnsupportedService(req);
  };
  
  /**
   * Handles DeviceCommunicationControl requests from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The DeviceCommunicationControl request content
   * @private
   */
  #onBacnetDeviceCommunicationControl = (req: BaseEventContent) => {
    debug('new request: deviceCommunicationControl');
    this.#onBacnetUnsupportedService(req);
  };
  
  /**
   * Handles ReadPropertyMultiple requests from other BACnet devices
   * 
   * This method processes requests to read multiple properties and
   * returns all the requested property values in a single response.
   * 
   * @param req - The ReadPropertyMultiple request content
   * @private
   */
  #onBacnetReadPropertyMultiple = async (req: ReadPropertyMultipleContent) => { 
    debug('new request: readPropertyMultiple');
    const { header, invokeId, payload: { properties } } = req;
    if (!header) return;
    const values: BACNetReadAccess[] = [];
    for (const { objectId: { type, instance }, properties: objProperties } of properties) { 
      const object = this.#objects.get(type)?.get(instance);
      if (object) { 
        values.push(await object.___readPropertyMultiple(objProperties));
      }
    }
    this.#client.readPropertyMultipleResponse({ address: header.sender.address }, invokeId!, values);
  };
  
  /**
   * Handles WriteProperty requests from other BACnet devices
   * 
   * This method processes requests to write values to properties.
   * 
   * @param req - The WriteProperty request content
   * @private
   */
  #onBacnetWriteProperty = async (req: WritePropertyContent) => { 
    debug('req #%s: writeProperty');
    const { header, service, invokeId } = req;
    if (!header) return;
    try {
      const { payload: { objectId, property, value } } = req;
      const _value = value?.value;
      const _property = value?.property ?? property;
      if (!_value || !_property) {
        return; // TODO: throw
      }
      await this.#handleObjectReq(req, objectId, async (object) => {
        await object.___writeProperty(_property, _value);
      });  
      this.#client.simpleAckResponse({ address: header.sender.address }, service!, invokeId!);
    } catch (err) { 
      if (err instanceof BDError) {
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, err.class, err.code);
      } else { 
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
      }
    }
  };
  
  /**
   * Handles AddListElement requests from other BACnet devices
   * 
   * This method processes requests to add elements to list properties.
   * Not fully implemented yet.
   * 
   * @param req - The AddListElement request content
   * @private
   */
  #onBacnetAddListElement = async (req: Omit<BaseEventContent, 'payload'> & { payload: ListElementOperationPayload }) => { 
    this.#onBacnetUnsupportedService(req);
  };
  
  /**
   * Handles RemoveListElement requests from other BACnet devices
   * 
   * This method processes requests to remove elements from list properties.
   * Not fully implemented yet.
   * 
   * @param req - The RemoveListElement request content
   * @private
   */
  #onBacnetRemoveListElement = async (req: Omit<BaseEventContent, 'payload'> & { payload: ListElementOperationPayload }) => {
    this.#onBacnetUnsupportedService(req);
  };
  
  #onBacnetGetEventInformation = async (req:  Omit<BaseEventContent, 'payload'> & { payload: BACNetEventInformation[];}) => { 
    this.#onBacnetUnsupportedService(req);
  };
  
  #onBacnetUnhandledEvent = async (req: Omit<BaseEventContent, 'payload'>) => {
    this.#onBacnetUnsupportedService(req);
  };
  
  #onBacnetUnsupportedService = async (req: Omit<BaseEventContent, 'payload'>) => { 
    const { header, invokeId, service } = req;
    debug('req #%s: %s (not supported)', invokeId, service ? ServicesSupported[service] : 'unknown');
    if (!header || !invokeId || typeof service !== 'number') { 
      return;
    }
    if (header.expectingReply) {
      this.#client.errorResponse({ address: header.sender.address }, service, invokeId, ErrorClass.SERVICES, ErrorCode.SERVICE_REQUEST_DENIED);
    }
  };
  
  /**
   * Handles errors from the BACnet client
   * 
   * This method emits errors to allow the application to handle them.
   * 
   * @param err - The error that occurred
   * @private
   */
  #onBacnetError = (err: Error) => {
    debug('server error', err);
    this.___emit('error', err);
  };
  
  /**
   * Handles the listening event from the BACnet client
   * 
   * This method emits a listening event when the BACnet node
   * starts listening on the network.
   * 
   * @private
   */
  #onBacnetListening = () => { 
    debug('server is listening');
    this.___emit('listening');
  };
  
    
}
