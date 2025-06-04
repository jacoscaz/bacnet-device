
import type { BACnetSubscription,  QueuedCov } from './node.js';
import type { BACnetDevice } from './objects/device.js';

import bacnet from '@innovation-system/node-bacnet';

const { default: BACnetClient } = bacnet;

/**
 * Type representing the BACnet client instance from the underlying library
 */
export type BACnetClientType = InstanceType<typeof BACnetClient>;

/**
 * Ensures that a value or array of values is returned as an array
 * 
 * @param val - A single value or array of values
 * @returns An array containing the input value(s)
 * @typeParam T - The type of the values
 */
export const ensureArray = <T>(val: T | T[]): T[] => {
  return Array.isArray(val) ? val : [val];
};

/**
 * Sends a confirmed COV (Change of Value) notification to a subscriber
 * 
 * This function sends a notification that requires confirmation from the recipient,
 * which helps ensure reliable delivery of property value changes.
 * 
 * @param client - The BACnet client instance used to send the notification
 * @param emitter - The BACnet device sending the notification
 * @param subscription - The subscription information for the recipient
 * @param cov - The change of value data to send
 * @returns A promise that resolves when the notification is confirmed or rejects on error
 */
export const sendConfirmedCovNotification = async (client: BACnetClientType, emitter: BACnetDevice, subscription: BACnetSubscription, cov: QueuedCov) => {
  return new Promise<void>((resolve, reject) => {
    client.confirmedCOVNotification(
      { address: subscription.subscriber.address },
      cov.object.identifier,
      subscription.subscriberProcessId,
      emitter.identifier.instance,
      Math.floor(Math.max(0, subscription.expiresAt - Date.now()) / 1000),
      [ { property: { id: cov.property.identifier }, value: ensureArray(cov.value) } ],
      (err) => err ? reject(err) : resolve(),
    );
  });
}

/**
 * Sends an unconfirmed COV (Change of Value) notification to a subscriber
 * 
 * This function sends a notification without requiring confirmation from the recipient.
 * This is more efficient but less reliable than confirmed notifications.
 * 
 * @param client - The BACnet client instance used to send the notification
 * @param emitter - The BACnet device sending the notification
 * @param subscription - The subscription information for the recipient
 * @param cov - The change of value data to send
 * @returns A promise that resolves when the notification is sent
 */
export const sendUnconfirmedCovNotification = async (client: BACnetClientType, emitter: BACnetDevice, subscription: BACnetSubscription, cov: QueuedCov) => {
  client.unconfirmedCOVNotification(
    subscription.subscriber,
    subscription.subscriberProcessId,
    emitter.identifier.instance,
    cov.object.identifier,
    Math.floor(Math.max(0, subscription.expiresAt - Date.now()) / 1000),
    [ { property: { id: cov.property.identifier }, value: ensureArray(cov.value) } ],
  );
}
