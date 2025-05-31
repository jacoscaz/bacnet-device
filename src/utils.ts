
import type { BACnetSubscription,  QueuedCov } from './node.js';
import type { BACnetDevice } from './device.js';

import bacnet from '@innovation-system/node-bacnet';

import { ErrorCode, ErrorClass } from './enums/errors.js';


const { 
  default: BACnetClient, 
} = bacnet;

export type BACnetClientType = InstanceType<typeof BACnetClient>;

export class BACnetError extends Error { 
  errorCode: ErrorCode;
  errorClass: ErrorClass;
  constructor(message: string, errorCode: ErrorCode, errorClass: ErrorClass) {
    super(message);
    this.errorCode = errorCode;
    this.errorClass = errorClass;
  }
}



export const sendConfirmedCovNotification = async (client: BACnetClientType, emitter: BACnetDevice, subscription: BACnetSubscription, cov: QueuedCov) => {
  return new Promise<void>((resolve, reject) => {
    client.confirmedCOVNotification(
      { address: subscription.subscriber.address },
      { type: cov.object.type, instance: cov.object.instanceId },
      subscription.subscriberProcessId,
      emitter.id,
      subscription.lifetime,
      [
        { property: { id: cov.property.identifier }, value: cov.data },
      ],
      (err) => err ? reject(err) : resolve(),
    );
  });
}

export const sendUnconfirmedCovNotification = async (client: BACnetClientType, emitter: BACnetDevice, subscription: BACnetSubscription, cov: QueuedCov) => {
  client.unconfirmedCOVNotification(
    subscription.subscriber,
    subscription.subscriberProcessId,
    emitter.id,
    { type: cov.object.type, instance: cov.object.instanceId },
    subscription.lifetime,
    [ { property: { id: cov.property.identifier }, value: cov.data } ],
  );
}
