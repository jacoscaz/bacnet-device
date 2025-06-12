
/**
 * BACnet application tag values
 * 
 * This enumeration represents the standard application tags in BACnet as defined
 * in the BACnet standard. Application tags identify the data type of a value in
 * BACnet communications.
 * 
 * Application tags are used in BACnet property values to indicate the data type
 * of the value being communicated.
 */
export enum BDApplicationTag {
  /** Represents a null value */
  NULL = 0,
  /** Represents a boolean value (true or false) */
  BOOLEAN = 1,
  /** Represents an unsigned integer value */
  UNSIGNED_INTEGER = 2,
  /** Represents a signed integer value */
  SIGNED_INTEGER = 3,
  /** Represents a 32-bit floating point value */
  REAL = 4,
  /** Represents a 64-bit floating point value */
  DOUBLE = 5,
  /** Represents an octet string (byte array) */
  OCTET_STRING = 6,
  /** Represents a character string */
  CHARACTER_STRING = 7,
  /** Represents a bit string (sequence of bits) */
  BIT_STRING = 8,
  /** Represents an enumerated value */
  ENUMERATED = 9,
  /** Represents a date value */
  DATE = 10,
  /** Represents a time value */
  TIME = 11,
  /** Represents an object identifier (type and instance) */
  OBJECTIDENTIFIER = 12,
  /** Represents an empty list */
  EMPTYLIST = 100,
  /** Represents a weekday value */
  WEEKNDAY = 101,
  /** Represents a date range */
  DATERANGE = 102,
  /** Represents a date and time value */
  DATETIME = 103,
  /** Represents a timestamp */
  TIMESTAMP = 104,
  /** Represents an error value */
  ERROR = 105,
  /** Represents a reference to a property of an object in a device */
  DEVICE_OBJECT_PROPERTY_REFERENCE = 106,
  /** Represents a reference to an object in a device */
  DEVICE_OBJECT_REFERENCE = 107,
  /** Represents a reference to a property of an object */
  OBJECT_PROPERTY_REFERENCE = 108,
  /** Represents a destination */
  DESTINATION = 109,
  /** Represents a recipient */
  RECIPIENT = 110,
  /** Represents a COV (Change of Value) subscription */
  COV_SUBSCRIPTION = 111,
  /** Represents a calendar entry */
  CALENDAR_ENTRY = 112,
  /** Represents a weekly schedule */
  WEEKLY_SCHEDULE = 113,
  /** Represents a special event */
  SPECIAL_EVENT = 114,
  /** Represents a read access specification */
  READ_ACCESS_SPECIFICATION = 115,
  /** Represents a read access result */
  READ_ACCESS_RESULT = 116,
  /** Represents a lighting command */
  LIGHTING_COMMAND = 117,
  /** Represents a decoded context-specific value */
  CONTEXT_SPECIFIC_DECODED = 118,
  /** Represents an encoded context-specific value */
  CONTEXT_SPECIFIC_ENCODED = 119,
  /** Represents a log record */
  LOG_RECORD = 120,
};
