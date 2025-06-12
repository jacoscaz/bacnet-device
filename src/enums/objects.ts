
/**
 * BACnet object type values
 * 
 * This enumeration represents the standard object types in BACnet as defined
 * in the BACnet standard. Each value identifies a specific type of object that
 * can exist in a BACnet system.
 * 
 * The object type is a fundamental component of an object identifier, which
 * uniquely identifies objects in a BACnet network.
 */
export enum BDObjectType {
  /** Represents an analog input point (e.g., temperature sensor) */
  ANALOG_INPUT = 0,
  /** Represents an analog output point (e.g., control valve) */
  ANALOG_OUTPUT = 1,
  /** Represents an analog value without direct hardware I/O */
  ANALOG_VALUE = 2,
  /** Represents a binary input point (e.g., switch) */
  BINARY_INPUT = 3,
  /** Represents a binary output point (e.g., relay) */
  BINARY_OUTPUT = 4,
  /** Represents a binary value without direct hardware I/O */
  BINARY_VALUE = 5,
  /** Represents a collection of dates */
  CALENDAR = 6,
  /** Represents a complex control sequence */
  COMMAND = 7,
  /** Represents a BACnet device */
  DEVICE = 8,
  /** Represents an alarm or event monitoring object */
  EVENT_ENROLLMENT = 9,
  /** Represents a file accessible via BACnet services */
  FILE = 10,
  /** Represents a collection of object references */
  GROUP = 11,
  /** Represents a control loop */
  LOOP = 12,
  /** Represents a multi-state input point with multiple possible states */
  MULTI_STATE_INPUT = 13,
  /** Represents a multi-state output point with multiple possible states */
  MULTI_STATE_OUTPUT = 14,
  /** Represents a notification class for event distribution */
  NOTIFICATION_CLASS = 15,
  /** Represents a program object */
  PROGRAM = 16,
  /** Represents a schedule for automated control */
  SCHEDULE = 17,
  /** Represents an averaging calculation */
  AVERAGING = 18,
  /** Represents a multi-state value without direct hardware I/O */
  MULTI_STATE_VALUE = 19,
  /** Represents a trend log for collecting data samples */
  TREND_LOG = 20,
  /** Represents a life safety point */
  LIFE_SAFETY_POINT = 21,
  /** Represents a life safety zone */
  LIFE_SAFETY_ZONE = 22,
  /** Represents a pulse counter */
  ACCUMULATOR = 23,
  /** Converts pulse counts to engineering units */
  PULSE_CONVERTER = 24,
  /** Represents a log of events */
  EVENT_LOG = 25,
  /** Represents a global group accessible across the network */
  GLOBAL_GROUP = 26,
  /** Represents a trend log that logs multiple values */
  TREND_LOG_MULTIPLE = 27,
  /** Represents a load control object for demand management */
  LOAD_CONTROL = 28,
  /** Represents a structured view of objects */
  STRUCTURED_VIEW = 29,
  /** Represents a physical access door */
  ACCESS_DOOR = 30,
  /** Represents a timer object */
  TIMER = 31,
  /** Represents an access credential */
  ACCESS_CREDENTIAL = 32,
  /** Represents an access point */
  ACCESS_POINT = 33,
  /** Represents access rights */
  ACCESS_RIGHTS = 34,
  /** Represents an access user */
  ACCESS_USER = 35,
  /** Represents an access zone */
  ACCESS_ZONE = 36,
  /** Represents a credential data input device */
  CREDENTIAL_DATA_INPUT = 37,
  /** Represents network security settings */
  NETWORK_SECURITY = 38,
  /** Represents a BitString value */
  BITSTRING_VALUE = 39,
  /** Represents a CharacterString value */
  CHARACTERSTRING_VALUE = 40,
  /** Represents a DatePattern value */
  DATEPATTERN_VALUE = 41,
  /** Represents a Date value */
  DATE_VALUE = 42,
  /** Represents a DateTimePattern value */
  DATETIMEPATTERN_VALUE = 43,
  /** Represents a DateTime value */
  DATETIME_VALUE = 44,
  /** Represents an Integer value */
  INTEGER_VALUE = 45,
  /** Represents a Large Analog value */
  LARGE_ANALOG_VALUE = 46,
  /** Represents an OctetString value */
  OCTETSTRING_VALUE = 47,
  /** Represents a Positive Integer value */
  POSITIVE_INTEGER_VALUE = 48,
  /** Represents a TimePattern value */
  TIMEPATTERN_VALUE = 49,
  /** Represents a Time value */
  TIME_VALUE = 50,
  /** Represents a notification forwarder */
  NOTIFICATION_FORWARDER = 51,
  /** Represents an alert enrollment */
  ALERT_ENROLLMENT = 52,
  /** Represents a communication channel */
  CHANNEL = 53,
  /** Represents a lighting output */
  LIGHTING_OUTPUT = 54,
  /** Represents a binary lighting output */
  BINARY_LIGHTING_OUTPUT = 55,
  /** Represents a network port */
  NETWORK_PORT = 56,
  /** Represents an elevator group */
  ELEVATOR_GROUP = 57,
  /** Represents an escalator */
  ESCALATOR = 58,
  /** Represents a lift */
  LIFT = 59,
};
