
/**
 * BACnet node implementation module
 * 
 * This module provides the core functionality for a BACnet network node,
 * handling communication with other BACnet devices on the network.
 * 
 * @module
 */

import { isDeepStrictEqual } from 'node:util';
import { EventEmitter } from 'node:events';

import { 
  type BACnetClientType,
  sendConfirmedCovNotification,
  sendUnconfirmedCovNotification,
} from './utils.js';

import { type BACnetValue } from './value.js';
import { BACnetError } from './errors.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  PropertyIdentifier,
} from './enums/index.js';

import bacnet, {
  type BACnetMessageHeader,
  type ListElementOperationPayload,
  type SubscribeCovPayload,
  Segmentation,
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type ReadPropertyMultipleContent,
  type SubscribeCovContent,
  type WritePropertyContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { BACnetObject } from './object.js';

import { type BACnetProperty } from './properties/index.js';
import { BACnetDevice } from './objects/device.js';

import fastq from 'fastq';

import Debug from 'debug';

const debug = Debug('bacnet:node');

const { default: BACnetClient } = bacnet;

/**
 * Represents a subscription to COV (Change of Value) notifications
 * 
 * This interface defines the details of a COV subscription from another
 * BACnet device.
 */
export interface BACnetSubscription { 
  /** Process ID of the subscribing device */
  subscriberProcessId: number;
  
  /** Object ID being monitored for changes */
  monitoredObjectId: bacnet.BACNetObjectID,
  
  /** Whether to send confirmed notifications */
  issueConfirmedNotifications: boolean;
  
  /** Expiration time in milliseconds since unix epoch */
  expiresAt: number;
  
  /** Network address information of the subscriber */
  subscriber: BACnetMessageHeader['sender'];
}

/**
 * Represents a queued Change of Value notification
 * 
 * This interface defines the data needed to send a COV notification
 * to subscribed devices.
 */
export interface QueuedCov {
  /** The BACnet object that changed */
  object: BACnetObject;
  
  /** The property within the object that changed */
  property: BACnetProperty<any, any>;
  
  /** The new value of the property */
  value: BACnetValue | BACnetValue[];
}

/**
 * Events that can be emitted by a BACnet node
 */
export interface BACnetNodeEvents { 
  /** Emitted when an error occurs in the BACnet node */
  error: [err: Error];
  
  /** Emitted when the BACnet node starts listening on the network */
  listening: [];
}

/**
 * Represents a BACnet network node
 * 
 * This class implements a BACnet node that can host a BACnet device and
 * communicate with other BACnet devices on the network. It handles all the
 * BACnet protocol communication and event processing.
 */
export class BACnetNode extends EventEmitter<BACnetNodeEvents> {
  
  /** The underlying BACnet client from the bacnet library */
  readonly #client: BACnetClientType;
  
  /** Queue for processing COV notifications */
  readonly #covqueue: fastq.queueAsPromised<QueuedCov>;
  
  /** Map of active subscriptions organized by object type and instance */
  readonly #subscriptions: Map<ObjectType, Map<number, Set<BACnetSubscription>>>;
  
  /** The BACnet device hosted by this node */
  #device: BACnetDevice | null;
  
  /** Timer for periodic maintenance tasks */
  #maintenanceInterval: NodeJS.Timer;
  
  /**
   * Creates a new BACnet node
   * 
   * @param opts - Configuration options for the BACnet client
   */
  constructor(opts: bacnet.ClientOptions) {
    super();
    const client = new BACnetClient(opts);
    this.#device = null;
    this.#client = client;
    this.#covqueue = fastq.promise(null, this.#covQueueWorker, 1);
    this.#subscriptions = new Map();
    this.#maintenanceInterval = setInterval(this.#onMaintenance, 30_000);
    client.on('whoHas', this.#onWhoHas);
    client.on('iAm', this.#onIAm);
    client.on('iHave', this.#onIHave);
    client.on('error', this.#onError);
    client.on('readRange', this.#onReadRange);
    client.on('deviceCommunicationControl', this.#onDeviceCommunicationControl);
    client.on('listening', this.#onListening);
    client.on('readProperty', this.#onReadProperty);
    client.on('whoIs', this.#onWhoIs);
    client.on('subscribeCov', this.#onSubscribeCov);
    client.on('subscribeProperty', this.#onSubscribeProperty);
    client.on('readPropertyMultiple', this.#onReadPropertyMultiple);
    client.on('writeProperty', this.#onWriteProperty);
    client.on('addListElement', this.#onAddListElement);
    client.on('removeListElement', this.#onRemoveListElement);
  }
  
  /**
   * Adds a BACnet device to this node
   * 
   * Each node can only host a single BACnet device. This method adds
   * the device and sets up the necessary event subscriptions.
   * 
   * @param device - The BACnet device to add to this node
   * @returns The added device
   * @throws Error if a device is already added to this node
   */
  addDevice(device: BACnetDevice) { 
    if (this.#device) { 
      throw new Error('cannot add more than one device per node');
    }
    this.#device = device; 
    device.subscribe('aftercov', this.#onCov);
    return this.#device;
  }
  
  /**
   * Handles periodic maintenance of subscriptions
   * 
   * This method runs periodically to clean up expired subscriptions.
   * 
   * @private
   */
  #onMaintenance = () => { 
    const now = Date.now();
    for (const [type, typeSubs] of this.#subscriptions.entries()) { 
      for (const [instance, instanceSubs] of typeSubs.entries()) {
        for (const sub of instanceSubs) { 
          if (sub.expiresAt < now) { 
            instanceSubs.delete(sub);
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
  #covQueueWorker = async (cov: QueuedCov) => { 
    const now = Date.now();
    if (cov.property.identifier === PropertyIdentifier.PRESENT_VALUE) { 
      const subscriptions = this.#subscriptions.get(cov.object.identifier.type)?.get(cov.object.identifier.instance);
      if (subscriptions) {
        for (const subscription of subscriptions) {
          if (now < subscription.expiresAt) {
            if (subscription.issueConfirmedNotifications) {
              await sendConfirmedCovNotification(this.#client, this.#device!, subscription, cov);
            } else {
              await sendUnconfirmedCovNotification(this.#client, this.#device!, subscription, cov);
            }
          } else {
            subscriptions.delete(subscription);
          }
        } 
      }
    }
  };
  
  /**
   * Handles 'aftercov' events from BACnet objects
   * 
   * This method queues COV notifications when object properties change.
   * 
   * @param object - The object that changed
   * @param property - The property that changed
   * @param value - The new value
   * @private
   */
  #onCov = async (object: BACnetObject, property: BACnetProperty<any, any>, value: BACnetValue | BACnetValue[]) => {
    await this.#covqueue.push({ object, property, value });
  };
  
  /**
   * Handles ReadProperty requests from other BACnet devices
   * 
   * This method processes ReadProperty requests and returns the requested
   * property value or an appropriate error.
   * 
   * @param req - The ReadProperty request content
   * @private
   */
  #onReadProperty = async (req: ReadPropertyContent) => {
    const { payload: { objectId, property }, address, header, service, invokeId } = req;
    debug('req #%s: readProperty, object %s %s, property %s', invokeId, ObjectType[objectId.type as ObjectType], objectId.instance, PropertyIdentifier[property.id as PropertyIdentifier]);
    if (!header) return;
    if (!this.#device) return;
    try {
      const data = await this.#device.___readObjectProperty(req);
      this.#client.readPropertyResponse({ address: header.sender.address }, invokeId!, objectId, property, data);
    } catch (err) { 
      if (err instanceof BACnetError) {
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, err.errorClass, err.errorCode);
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
  #onSubscribeCov = async (req: SubscribeCovContent) => {
    const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
    debug('new subscription: object %s %s', ObjectType[monitoredObjectId.type as ObjectType], monitoredObjectId.instance);
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
    let previous: BACnetSubscription | null = null;
    for (const sub of instanceSubs) { 
      if (sub.subscriber.address === header.sender.address
        && isDeepStrictEqual(monitoredObjectId, sub.monitoredObjectId)
        && sub.subscriberProcessId === subscriberProcessId
      ) { 
        previous = sub;
      }
    }
    if (previous) {
      debug('updating previous subscription');
      previous.expiresAt = Date.now() + (lifetime * 1000);
    } else { 
      debug('registering new subscription');
      instanceSubs.add({
        subscriberProcessId,
        issueConfirmedNotifications,
        expiresAt: Date.now() + (lifetime * 1000),
        monitoredObjectId,
        subscriber: header.sender,
      });
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
  #onSubscribeProperty = async (req: Omit<BaseEventContent, 'payload'> & { payload: SubscribeCovPayload }) => { 
    debug('new request: subscribeProperty');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
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
  #onWhoIs = (req: BaseEventContent) => { 
    debug('new request: whoIs');
    const { header } = req;
    if (!header) return;
    if (!this.#device) return;
    this.#client.iAmResponse({ address: header.sender.address }, this.#device.identifier.instance, Segmentation.NO_SEGMENTATION, this.#device.vendorId);
  }
  
  /**
   * Handles WhoHas requests from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The WhoHas request content
   * @private
   */
  #onWhoHas = (req: BaseEventContent) => {
    debug('new request: whoHas');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  /**
   * Handles IAm notifications from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The IAm notification content
   * @private
   */
  #onIAm = (req: BaseEventContent) => {
    debug('new request: iAm');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  /**
   * Handles IHave notifications from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The IHave notification content
   * @private
   */
  #onIHave = (req: BaseEventContent) => {
    debug('new request: iHave');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  /**
   * Handles ReadRange requests from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The ReadRange request content
   * @private
   */
  #onReadRange = (req: BaseEventContent) => {
    debug('new request: readRange');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  /**
   * Handles DeviceCommunicationControl requests from other BACnet devices
   * 
   * Currently not fully implemented, returns an error response.
   * 
   * @param req - The DeviceCommunicationControl request content
   * @private
   */
  #onDeviceCommunicationControl = (req: BaseEventContent) => {
    debug('new request: deviceCommunicationControl');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
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
  #onReadPropertyMultiple = async (req: ReadPropertyMultipleContent) => { 
    debug('new request: readPropertyMultiple');
    const { header, invokeId, payload: { properties } } = req;
    if (!header) return;
    if (!this.#device) return;
    const values = await this.#device.___readObjectPropertyMultiple(properties);
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
  #onWriteProperty = async (req: WritePropertyContent) => { 
    debug('req #%s: writeProperty');
    const { header, service, invokeId } = req;
    if (!header) return;
    if (!this.#device) return;
    try {
      await this.#device.___writeObjectProperty(req);
      this.#client.simpleAckResponse({ address: header.sender.address }, service!, invokeId!);
    } catch (err) { 
      if (err instanceof BACnetError) {
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, err.errorClass, err.errorCode);
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
  #onAddListElement = async (req: Omit<BaseEventContent, 'payload'> & { payload: ListElementOperationPayload }) => { 
    const { payload: { } } = req;
    // objectId
    // propertyId
    // arrayIndex
    // listOfElements
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
  #onRemoveListElement = async (req: Omit<BaseEventContent, 'payload'> & { payload: ListElementOperationPayload }) => { };
  
  /**
   * Handles errors from the BACnet client
   * 
   * This method emits errors to allow the application to handle them.
   * 
   * @param err - The error that occurred
   * @private
   */
  #onError = (err: Error) => {
    debug('server error', err);
    this.emit('error', err);
  };
  
  /**
   * Handles the listening event from the BACnet client
   * 
   * This method emits a listening event when the BACnet node
   * starts listening on the network.
   * 
   * @private
   */
  #onListening = () => { 
    debug('server is listening');
    this.emit('listening');
  };
  
}
