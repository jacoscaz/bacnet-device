
import { BitString } from './bitstring.js'; 

/**
 * Enumeration of the standard BACnet service bit positions
 * 
 * These values represent the bit positions in a Protocol_Services_Supported bitstring
 * as defined in the BACnet standard. Each bit corresponds to a specific BACnet service
 * that a device may support.
 */
export enum SupportedServicesBit {
  /** Acknowledge Alarm service */
  ACKNOWLEDGE_ALARM = 0,
  /** Confirmed COV Notification service */
  CONFIRMED_COV_NOTIFICATION = 1,
  /** Confirmed Event Notification service */
  CONFIRMED_EVENT_NOTIFICATION = 2,
  /** Get Alarm Summary service */
  GET_ALARM_SUMMARY = 3,
  /** Get Enrollment Summary service */
  GET_ENROLLMENT_SUMMARY = 4,
  /** Subscribe COV service */
  SUBSCRIBE_COV = 5,
  /** Atomic Read File service */
  ATOMIC_READ_FILE = 6,
  /** Atomic Write File service */
  ATOMIC_WRITE_FILE = 7,
  /** Add List Element service */
  ADD_LIST_ELEMENT = 8,
  /** Remove List Element service */
  REMOVE_LIST_ELEMENT = 9,
  /** Create Object service */
  CREATE_OBJECT = 10,
  /** Delete Object service */
  DELETE_OBJECT = 11,
  /** Read Property service */
  READ_PROPERTY = 12,
  /** Read Property Conditional service */
  READ_PROPERTY_CONDITIONAL = 13,
  /** Read Property Multiple service */
  READ_PROPERTY_MULTIPLE = 14,
  /** Write Property service */
  WRITE_PROPERTY = 15,
  /** Write Property Multiple service */
  WRITE_PROPERTY_MULTIPLE = 16,
  /** Device Communication Control service */
  DEVICE_COMMUNICATION_CONTROL = 17,
  /** Confirmed Private Transfer service */
  CONFIRMED_PRIVATE_TRANSFER = 18,
  /** Confirmed Text Message service */
  CONFIRMED_TEXT_MESSAGE = 19,
  /** Reinitialize Device service */
  REINITIALIZE_DEVICE = 20,
  /** VT Open service */
  VT_OPEN = 21,
  /** VT Close service */
  VT_CLOSE = 22,
  /** VT Data service */
  VT_DATA = 23,
  /** Authenticate service */
  AUTHENTICATE = 24,
  /** Request Key service */
  REQUEST_KEY = 25,
  /** I Am service */
  I_AM = 26,
  /** I Have service */
  I_HAVE = 27,
  /** Unconfirmed COV Notification service */
  UNCONFIRMED_COV_NOTIFICATION = 28,
  /** Unconfirmed Event Notification service */
  UNCONFIRMED_EVENT_NOTIFICATION = 29,
  /** Unconfirmed Private Transfer service */
  UNCONFIRMED_PRIVATE_TRANSFER = 30,
  /** Unconfirmed Text Message service */
  UNCONFIRMED_TEXT_MESSAGE = 31,
  /** Time Synchronization service */
  TIME_SYNCHRONIZATION = 32,
  /** Who Has service */
  WHO_HAS = 33,
  /** Who Is service */
  WHO_IS = 34,
  /** Read Range service */
  READ_RANGE = 35,
  /** UTC Time Synchronization service */
  UTC_TIME_SYNCHRONIZATION = 36,
  /** Life Safety Operation service */
  LIFE_SAFETY_OPERATION = 37,
  /** Subscribe COV Property service */
  SUBSCRIBE_COV_PROPERTY = 38,
  /** Get Event Information service */
  GET_EVENT_INFORMATION = 39,
  /** Write Group service */
  WRITE_GROUP = 40,
  /** Subscribe COV Property Multiple service */
  SUBSCRIBE_COV_PROPERTY_MULTIPLE = 41,
  /** Confirmed COV Notification Multiple service */
  CONFIRMED_COV_NOTIFICATION_MULTIPLE = 42,
  /** Unconfirmed COV Notification Multiple service */
  UNCONFIRMED_COV_NOTIFICATION_MULTIPLE = 43,
}

/**
 * Implementation of the Protocol_Services_Supported bitstring
 * 
 * This bitstring represents the services supported by a BACnet device,
 * as defined in the BACnet standard. It is used in the Protocol_Services_Supported
 * property of the Device object.
 * 
 * The BACnet standard defines a large number of possible services. This implementation
 * allocates 112 bits to accommodate all standard services, including those that might
 * be added in future versions of the standard.
 * 
 * @extends BitString<typeof SupportedServicesBit>
 */
export class SupportedServicesBitString extends BitString<typeof SupportedServicesBit> {
  /**
   * Creates a new SupportedServices bitstring with the specified bits set to 1
   * 
   * @param trueBits - Array of SupportedServicesBit values representing the services supported by the device
   */
  constructor(...trueBits: SupportedServicesBit[]) { 
    super(112, trueBits);
  }
}

