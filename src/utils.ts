
import type { BDSubscription,  BDQueuedCov } from './objects/device/types.js';
import type { BDDevice } from './objects/device/device.js';

import bacnet from '@innovation-system/node-bacnet';

const { default: BACnetClient } = bacnet;

/**
 * Type representing the BACnet client instance from the underlying library
 */
export type BACNetClientType = InstanceType<typeof BACnetClient>;

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
export const sendConfirmedCovNotification = async (client: BACNetClientType, emitter: BDDevice, subscription: BDSubscription, cov: BDQueuedCov) => {
  return new Promise<void>((resolve, reject) => {
    client.confirmedCOVNotification(
      { address: subscription.subscriber.address },
      cov.object.identifier,
      subscription.subscriptionProcessId,
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
export const sendUnconfirmedCovNotification = async (client: BACNetClientType, emitter: BDDevice, subscription: BDSubscription, cov: BDQueuedCov) => {
  client.unconfirmedCOVNotification(
    subscription.subscriber,
    subscription.subscriptionProcessId,
    emitter.identifier.instance,
    cov.object.identifier,
    Math.floor(Math.max(0, subscription.expiresAt - Date.now()) / 1000),
    [ { property: { id: cov.property.identifier }, value: ensureArray(cov.value) } ],
  );
}

/**
 * Start date of the process.
 */
export const PROCESS_START_DATE = new Date();

/**
 * Standard time zone offset local to the computer running this code.
 */
export const STD_TZ_OFFSET = Math.max(
  new Date(PROCESS_START_DATE.getFullYear(), 0, 1).getTimezoneOffset(),
  new Date(PROCESS_START_DATE.getFullYear(), 6, 1).getTimezoneOffset(),
); 

/**
 * Returns whether daylight saving time is in effect for a given date,
 * relative to the local time zone of the computer running this code.
 */
export const isDstInEffect = (date: Date): boolean => { 
  return date.getTimezoneOffset() < STD_TZ_OFFSET;
};
