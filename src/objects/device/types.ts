
import {
  type BDObject,
  type BDObjectEvents,
} from '../generic/object.js';

import {
  type BDAbstractProperty,
} from '../../properties/index.js';

import {
  type BACNetObjectID,
  type BACnetMessageHeader,
  type ClientOptions,
  type BACNetPropertyID,
  type BACNetCovSubscription,
  type BACNetAppData,
} from '@innovation-system/node-bacnet';

/**
 * Represents a subscription to COV (Change of Value) notifications
 * 
 * This interface defines the details of a COV subscription from another
 * BACnet device.
 */
export interface BDSubscription extends BACNetCovSubscription { 
  
  recipient: {
    network: number;
    address: number[];
  };
  
  /** Process ID of the subscribing device */
  subscriptionProcessId: number;
  
  /** Object ID being monitored for changes */
  monitoredObjectId: BACNetObjectID,
  
  /** Property ID being monitored for changes */
  monitoredProperty: BACNetPropertyID;
  
  /** Whether to send confirmed notifications */
  issueConfirmedNotifications: boolean;
  
  /** Expiration time in milliseconds since unix epoch */
  expiresAt: number;
  
  /** Network address information of the subscriber */
  subscriber: BACnetMessageHeader['sender'];
  
  /** Counter of COV notifications sent through this subscription  */
  covIncrement: number;
}

/**
 * Represents a queued Change of Value notification
 * 
 * This interface defines the data needed to send a COV notification
 * to subscribed devices.
 */
export interface BDQueuedCov {
  /** The BACnet object that changed */
  object: BDObject;
  
  /** The property within the object that changed */
  property: BDAbstractProperty<any, any, any>;
  
  /** The new value of the property */
  value: BACNetAppData | BACNetAppData[];
}

/**
 * Events that can be emitted by a BACnet node
 */
export interface BDDeviceEvents extends BDObjectEvents { 
  /** Emitted when an error occurs in the BACnet node */
  error: [err: Error];
  
  /** Emitted when the BACnet node starts listening on the network */
  listening: [];
}

/**
 * Configuration options for creating a BACnet Device object
 * 
 * This interface defines the parameters required to initialize a BACnet Device,
 * including identification, vendor information, and protocol configuration.
 */
export type BDDeviceOpts = ClientOptions & {
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
   * The device's description (Description property)
   */
  description: string;
  
  /**
   * Vendor identifier assigned by ASHRAE
   * @see https://bacnet.org/assigned-vendor-ids/
   */
  vendorId?: number;
  
  /**
   * The name of the device's vendor
   */
  vendorName?: string;
  
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
  apduMaxLength?: number;
  
  /**
   * APDU timeout in milliseconds
   */
  apduTimeout?: number;
  
  /**
   * Number of APDU retries
   */
  apduRetries?: number;
  
  apduSegmentTimeout?: number;
  
  /**
   * Current database revision number
   */
  databaseRevision: number;
  
  /**
   * General description of the device's physical location
   * e.g. "Room 101, Building A, Campus X"
   */
  location?: string;
  
  /**
   * Serial number of the device
   * e.g. "SN-12345-6789"
   */
  serialNumber?: string;
}