
import { isDeepStrictEqual } from 'node:util';
import { EventEmitter } from 'node:events';

import { 
  type BACnetClientType,
  BACnetError,
  sendConfirmedCovNotification,
  sendUnconfirmedCovNotification,
} from './utils.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ObjectTypeName,
  PropertyIdentifier,
  PropertyIdentifierName,
} from './enums/index.js';

import bacnet, { 
  type BACNetAppData,
  type BACnetMessageHeader,
  type BACNetReadAccess,
  type SubscribeCovPayload,
  Segmentation,
} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type ReadPropertyMultipleContent,
  type SubscribeCovContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { BACnetObject } from './object.js';

import { BACnetProperty } from './property.js';
import { BACnetDevice, type DeviceCovHandler } from './device.js';

import fastq from 'fastq';

import Debug from 'debug';

const debug = Debug('bacnet:node');

const { default: BACnetClient } = bacnet;

export interface BACnetSubscription { 
  subscriberProcessId: number;
  monitoredObjectId: bacnet.BACNetObjectID,
  issueConfirmedNotifications: boolean;
  /** milliseconds since unix epoch */
  expiresAt: number;
  subscriber: BACnetMessageHeader['sender'];
}

export interface QueuedCov { 
  device: BACnetDevice;
  object: BACnetObject;
  property: BACnetProperty;
  data: BACNetAppData[];
}

export interface BACnetNodeEvents { 
  error: [err: Error];
  listening: [];
}

export class BACnetNode extends EventEmitter<BACnetNodeEvents> {
  
  readonly #client: BACnetClientType;
  readonly #covqueue: fastq.queueAsPromised<QueuedCov>;
  readonly #subscriptions: Map<ObjectType, Map<number, Set<BACnetSubscription>>>;
  
  #device: BACnetDevice | null;
  #maintenanceInterval: NodeJS.Timer;
  
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
  }
  
  initDevice(id: number, name: string, vendorId: number) { 
    if (this.#device) { 
      throw new Error('device already initialized');
    }
    this.#device = new BACnetDevice(id, name, vendorId, this.#onCov);
    return this.#device;
  }
  
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
  
  #onCov: DeviceCovHandler = async (device: BACnetDevice, object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => {
    await this.#covqueue.push({ device, object, property, data });
  };
  
  #onReadProperty = async (req: ReadPropertyContent) => {
    const { payload: { objectId, property }, address, header, service, invokeId } = req;
    debug('req #%s: readProperty, object %s %s, property %s', invokeId, ObjectTypeName[objectId.type as ObjectType], objectId.instance, PropertyIdentifierName[property.id as PropertyIdentifier]);
    if (!header) return;
    if (!this.#device) return;
    try {
      const data = await this.#device.___readProperty(req);
      this.#client.readPropertyResponse({ address: header.sender.address }, invokeId!, objectId, property, data);
    } catch (err) { 
      if (err instanceof BACnetError) {
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, err.errorClass, err.errorCode);
      } else { 
        this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
      }
    }
  }
  
  #onSubscribeCov = async (req: SubscribeCovContent) => {
    const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
    debug('new subscription: object %s %s', ObjectTypeName[monitoredObjectId.type as ObjectType], monitoredObjectId.instance);
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
  
  // Implementing onSubscribeCovProperty requires the underlying
  // @innovation-system/node-bacnet library to add support for the
  // full payload of this kind of event, which includes - in addition
  // to the properties of the standard onSubscribeCov event - the 
  // following:
  // - monitored property: reference to the specific property being monitored
  // - covIncrement: (optional) minimum value change required to send cov
  #onSubscribeProperty = async (req: Omit<BaseEventContent, 'payload'> & { payload: SubscribeCovPayload }) => { 
    debug('new request: subscribeProperty');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
    // const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
  };
  
  #onWhoIs = (req: BaseEventContent) => { 
    debug('new request: whoIs');
    const { header } = req;
    if (!header) return;
    if (!this.#device) return;
    this.#client.iAmResponse({ address: header.sender.address }, this.#device.id, Segmentation.NO_SEGMENTATION, this.#device.vendorId);
  }
  
  #onWhoHas = (req: BaseEventContent) => {
    debug('new request: whoHas');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onIAm = (req: BaseEventContent) => {
    debug('new request: iAm');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onIHave = (req: BaseEventContent) => {
    debug('new request: iHave');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onReadRange = (req: BaseEventContent) => {
    debug('new request: readRange');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onDeviceCommunicationControl = (req: BaseEventContent) => {
    debug('new request: deviceCommunicationControl');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onReadPropertyMultiple = async (req: ReadPropertyMultipleContent) => { 
    debug('new request: readPropertyMultiple');
    const { header, invokeId, payload: { properties } } = req;
    if (!header) return;
    if (!this.#device) return;
    const values = await this.#device.___readPropertyMultiple(properties);
    this.#client.readPropertyMultipleResponse({ address: header.sender.address }, invokeId!, values);
  };
  
  #onError = (err: Error) => {
    debug('server error', err);
    this.emit('error', err);
  };
  
  #onListening = () => { 
    debug('server is listening');
    this.emit('listening');
  };
  
}
