
import { BitString } from './bitstring.js'; 

/**
 * Enumeration of the standard BACnet object type bit positions
 * 
 * These values represent the bit positions in a Protocol_Object_Types_Supported bitstring
 * as defined in the BACnet standard. Each bit corresponds to a specific object type that
 * a BACnet device may support.
 */
export enum SupportedObjectTypesBit {
  /** Analog Input object type */
  ANALOG_INPUT = 0,
  /** Analog Output object type */
  ANALOG_OUTPUT = 1,
  /** Analog Value object type */
  ANALOG_VALUE = 2,
  /** Binary Input object type */
  BINARY_INPUT = 3,
  /** Binary Output object type */
  BINARY_OUTPUT = 4,
  /** Binary Value object type */
  BINARY_VALUE = 5,
  /** Calendar object type */
  CALENDAR = 6,
  /** Command object type */
  COMMAND = 7,
  /** Device object type */
  DEVICE = 8,
  /** Event Enrollment object type */
  EVENT_ENROLLMENT = 9,
  /** File object type */
  FILE = 10,
  /** Group object type */
  GROUP = 11,
  /** Loop object type */
  LOOP = 12,
  /** Multi-state Input object type */
  MULTI_STATE_INPUT = 13,
  /** Multi-state Output object type */
  MULTI_STATE_OUTPUT = 14,
  /** Notification Class object type */
  NOTIFICATION_CLASS = 15,
  /** Program object type */
  PROGRAM = 16,
  /** Schedule object type */
  SCHEDULE = 17,
  /** Averaging object type */
  AVERAGING = 18,
  /** Multi-state Value object type */
  MULTI_STATE_VALUE = 19,
  /** Trend Log object type */
  TREND_LOG = 20,
  /** Life Safety Point object type */
  LIFE_SAFETY_POINT = 21,
  /** Life Safety Zone object type */
  LIFE_SAFETY_ZONE = 22,
  /** Accumulator object type */
  ACCUMULATOR = 23,
  /** Pulse Converter object type */
  PULSE_CONVERTER = 24,
  /** Event Log object type */
  EVENT_LOG = 25,
  /** Global Group object type */
  GLOBAL_GROUP = 26,
  /** Trend Log Multiple object type */
  TREND_LOG_MULTIPLE = 27,
  /** Load Control object type */
  LOAD_CONTROL = 28,
  /** Structured View object type */
  STRUCTURED_VIEW = 29,
  /** Access Door object type */
  ACCESS_DOOR = 30,
  /** Timer object type */
  TIMER = 31,
  /** Access Credential object type */
  ACCESS_CREDENTIAL = 32,
  /** Access Point object type */
  ACCESS_POINT = 33,
  /** Access Rights object type */
  ACCESS_RIGHTS = 34,
  /** Access User object type */
  ACCESS_USER = 35,
  /** Access Zone object type */
  ACCESS_ZONE = 36,
  /** Credential Data Input object type */
  CREDENTIAL_DATA_INPUT = 37,
  /** Network Security object type */
  NETWORK_SECURITY = 38,
  /** BitString Value object type */
  BITSTRING_VALUE = 39,
  /** CharacterString Value object type */
  CHARACTERSTRING_VALUE = 40,
  /** DatePattern Value object type */
  DATEPATTERN_VALUE = 41,
  /** Date Value object type */
  DATE_VALUE = 42,
  /** DateTimePattern Value object type */
  DATETIMEPATTERN_VALUE = 43,
  /** DateTime Value object type */
  DATETIME_VALUE = 44,
  /** Integer Value object type */
  INTEGER_VALUE = 45,
  /** Large Analog Value object type */
  LARGE_ANALOG_VALUE = 46,
  /** OctetString Value object type */
  OCTETSTRING_VALUE = 47,
  /** Positive Integer Value object type */
  POSITIVE_INTEGER_VALUE = 48,
  /** TimePattern Value object type */
  TIMEPATTERN_VALUE = 49,
  /** Time Value object type */
  TIME_VALUE = 50,
  /** Notification Forwarder object type */
  NOTIFICATION_FORWARDER = 51,
  /** Alert Enrollment object type */
  ALERT_ENROLLMENT = 52,
  /** Channel object type */
  CHANNEL = 53,
  /** Lighting Output object type */
  LIGHTING_OUTPUT = 54,
  /** Binary Lighting Output object type */
  BINARY_LIGHTING_OUTPUT = 55,
  /** Network Port object type */
  NETWORK_PORT = 56,
  /** Elevator Group object type */
  ELEVATOR_GROUP = 57,
  /** Escalator object type */
  ESCALATOR = 58,
  /** Lift object type */
  LIFT = 59,
};

/**
 * Implementation of the Protocol_Object_Types_Supported bitstring
 * 
 * This bitstring represents the object types supported by a BACnet device,
 * as defined in the BACnet standard. It is used in the Protocol_Object_Types_Supported
 * property of the Device object.
 * 
 * The BACnet standard defines a large number of possible object types. This implementation
 * allocates 112 bits to accommodate all standard object types, even though the current
 * highest-numbered object type is 59 (LIFT).
 * 
 * @extends BitString<typeof SupportedObjectTypesBit>
 */
export class SupportedObjectTypesBitString extends BitString<typeof SupportedObjectTypesBit> {
  /**
   * Creates a new SupportedObjectTypes bitstring with the specified bits set to 1
   * 
   * @param trueBits - Array of SupportedObjectTypesBit values representing the object types supported by the device
   */
  constructor(...trueBits: SupportedObjectTypesBit[]) { 
    super(112, trueBits);
  }
}

