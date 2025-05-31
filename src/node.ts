
import { 
  type BACnetClientType,
  BACnetError,
} from './utils.js';

import {
  ErrorCode,
  ErrorClass,
  PropertyIdentifier,
} from './enums/index.js';

import bacnet, { 
  type BACNetAppData,
  type BACnetMessageHeader,
  type SubscribeCovPayload,
  Segmentation,

} from '@innovation-system/node-bacnet';

import { 
  type BaseEventContent,
  type ReadPropertyContent,
  type SubscribeCovContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import { BACnetObject } from './object.js';

import { BACnetProperty } from './property.js';
import { BACnetDevice, type DeviceCovHandler } from './device.js';

import Debug from 'debug';

const debug = Debug('bacnet:node');

const { default: BACnetClient } = bacnet;

export interface BACnetSubscription { 
  subscriberProcessId: number;
  monitoredObjectId: bacnet.BACNetObjectID,
  issueConfirmedNotifications: boolean;
  lifetime: number;
  subscriber: BACnetMessageHeader['sender'];
}

export class BACnetNode {
  
  readonly #client: BACnetClientType;
  readonly #subscriptions: Map<number, Set<BACnetSubscription>>;
  
  #device: BACnetDevice | null;
  
  constructor(opts: bacnet.ClientOptions) {
    const client = new BACnetClient(opts);
    this.#device = null;
    this.#client = client;
    this.#subscriptions = new Map();
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
  }
  
  initDevice(id: number, name: string, vendorId: number) { 
    if (this.#device) { 
      throw new Error('device already initialized');
    }
    this.#device = new BACnetDevice(id, name, vendorId, this.#onCov);
    return this.#device;
  }
  
  #onCov: DeviceCovHandler = async (device: BACnetDevice, object: BACnetObject, property: BACnetProperty, data: BACNetAppData[]) => {
    if (property.identifier === PropertyIdentifier.PRESENT_VALUE && this.#subscriptions.has(object.instanceId)) { 
      for (const subscription of this.#subscriptions.get(object.instanceId)!) {
        if (subscription.issueConfirmedNotifications) {
          this.#client.confirmedCOVNotification(
            { address: subscription.subscriber.address },
            { type: object.type, instance: object.instanceId },
            subscription.subscriberProcessId,
            this.#device!.id,
            subscription.lifetime,
            [
              { property: { id: property.identifier }, value: data },
            ],
            (err) => { },
          );
        } else { 
          this.#client.unconfirmedCOVNotification(
            subscription.subscriber,
            subscription.subscriberProcessId,
            this.#device!.id,
            { type: object.type, instance: object.instanceId },
            subscription.lifetime,
            [
              { property: { id: property.identifier }, value: data },
            ],
          );
        } 
      }
    }
  };
  
  #onReadProperty = async (req: ReadPropertyContent) => {
    const { payload: { objectId, property }, address, header, service, invokeId } = req;
    debug('req #%s: readProperty, object %s, property %s', invokeId, objectId.instance, property.id);
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
    const { payload } = req;
    console.log('new request: readProperty');
    const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
    if (!header) return;
    if (!this.#subscriptions.has(monitoredObjectId.instance)) {
      this.#subscriptions.set(monitoredObjectId.instance, new Set());
    }
    this.#subscriptions.get(monitoredObjectId.instance)!.add({
      subscriberProcessId,
      issueConfirmedNotifications,
      lifetime,
      monitoredObjectId,
      subscriber: header.sender,
    });
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
    console.log('new request: readRange');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
    // const { payload: { subscriberProcessId, monitoredObjectId, issueConfirmedNotifications, lifetime }, header, service, invokeId } = req;
  };
  
  #onWhoIs = (req: BaseEventContent) => { 
    console.log('new request: whoIs');
    const { header } = req;
    if (!header) return;
    if (!this.#device) return;
    this.#client.iAmResponse({ address: header.sender.address }, this.#device.id, Segmentation.NO_SEGMENTATION, this.#device.vendorId);
  }
  
  #onWhoHas = (req: BaseEventContent) => {
    console.log('new request: whoHas');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onIAm = (req: BaseEventContent) => {
    console.log('new request: iAm');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onIHave = (req: BaseEventContent) => {
    console.log('new request: iHave');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onReadRange = (req: BaseEventContent) => {
    console.log('new request: readRange');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onDeviceCommunicationControl = (req: BaseEventContent) => {
    console.log('new request: deviceCommunicationControl');
    const { header, service, invokeId } = req;
    if (!header) return;
    this.#client.errorResponse({ address: header.sender.address }, service!, invokeId!, ErrorClass.DEVICE, ErrorCode.INTERNAL_ERROR);
  };
  
  #onError = (err: Error) => {
    console.log('server error', err);
  };
  
  #onListening = () => { 
    console.log('server is listening');
  };
  
}
