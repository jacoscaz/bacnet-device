
import type { BACnetSubscription,  QueuedCov } from './node.js';
import type { BACnetDevice } from './objects/device.js';

import bacnet from '@innovation-system/node-bacnet';

const { default: BACnetClient } = bacnet;

export type BACnetClientType = InstanceType<typeof BACnetClient>;

export const invertEnum = <E extends Record<string, string | number>>(enumeration: E) => {
  return Object.fromEntries(
    Object.entries(enumeration).map(([key, value]) => [value, key])
  ) as Record<E[keyof E], string>;
};

export const sendConfirmedCovNotification = async (client: BACnetClientType, emitter: BACnetDevice, subscription: BACnetSubscription, cov: QueuedCov) => {
  return new Promise<void>((resolve, reject) => {
    client.confirmedCOVNotification(
      { address: subscription.subscriber.address },
      cov.object.identifier,
      subscription.subscriberProcessId,
      emitter.identifier.instance,
      Math.floor(Math.max(0, subscription.expiresAt - Date.now()) / 1000),
      [ { property: { id: cov.property.identifier }, value: Array.isArray(cov.value) ? cov.value : [cov.value] } ],
      (err) => err ? reject(err) : resolve(),
    );
  });
}

export const sendUnconfirmedCovNotification = async (client: BACnetClientType, emitter: BACnetDevice, subscription: BACnetSubscription, cov: QueuedCov) => {
  client.unconfirmedCOVNotification(
    subscription.subscriber,
    subscription.subscriberProcessId,
    emitter.identifier.instance,
    cov.object.identifier,
    Math.floor(Math.max(0, subscription.expiresAt - Date.now()) / 1000),
    [ { property: { id: cov.property.identifier }, value: Array.isArray(cov.value) ? cov.value : [cov.value] } ],
  );
}
