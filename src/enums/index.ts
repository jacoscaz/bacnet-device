/**
 * BACnet enumeration values module
 * 
 * This module exports all the standard BACnet enumeration values used throughout
 * the library. These enumerations represent the standardized values defined in
 * the BACnet protocol specification.
 * 
 * @module enums
 */
 
export { 
  /**
   * BACnet timestamp type enumeration
   * 
   * Defines the different types of timestamps that can be used in BACnet
   * for time-stamping events and data.
   * 
   * @example
   * ```typescript
   * import { BDTimestampType } from './enums';
   * const timestampType = BDTimestampType.TIME;
   * ```
   */
  TimeStamp as BDTimestampType,
  
  /**
   * BACnet error code enumeration
   * 
   * Standard error codes defined by the BACnet protocol specification
   * for indicating various error conditions.
   * 
   * @example
   * ```typescript
   * import { BDErrorCode } from './enums';
   * const error = BDErrorCode.UNKNOWN_OBJECT;
   * ```
   */
  ErrorCode as BDErrorCode,
  
  /**
   * BACnet error class enumeration
   * 
   * Categories of errors that can occur in BACnet communication,
   * providing context for error handling.
   * 
   * @example
   * ```typescript
   * import { BDErrorClass } from './enums';
   * const errorClass = BDErrorClass.DEVICE;
   * ```
   */
  ErrorClass as BDErrorClass,
  
  /**
   * BACnet event state enumeration
   * 
   * Represents the current state of an event in the BACnet system,
   * used for alarm and event management.
   * 
   * @example
   * ```typescript
   * import { BDEventState } from './enums';
   * const state = BDEventState.NORMAL;
   * ```
   */
  EventState as BDEventState,
  
  /**
   * BACnet object type enumeration
   * 
   * Defines all the standard object types supported by the BACnet protocol,
   * such as analog inputs, binary outputs, devices, etc.
   * 
   * @example
   * ```typescript
   * import { BDObjectType } from './enums';
   * const objectType = BDObjectType.ANALOG_INPUT;
   * ```
   */
  ObjectType as BDObjectType,
  
  /**
   * BACnet reliability enumeration
   * 
   * Indicates the reliability status of a BACnet object or property,
   * helping to assess data quality and system health.
   * 
   * @example
   * ```typescript
   * import { BDReliability } from './enums';
   * const reliability = BDReliability.NO_FAULT_DETECTED;
   * ```
   */
  Reliability as BDReliability,
  
  /**
   * BACnet segmentation enumeration
   * 
   * Defines the segmentation capabilities of a BACnet device,
   * indicating how it handles large messages.
   * 
   * @example
   * ```typescript
   * import { BDSegmentation } from './enums';
   * const segmentation = BDSegmentation.SEGMENTED_BOTH;
   * ```
   */
  Segmentation as BDSegmentation,
  
  /**
   * BACnet device status enumeration
   * 
   * Represents the operational status of a BACnet device,
   * indicating its current state and availability.
   * 
   * @example
   * ```typescript
   * import { BDDeviceStatus } from './enums';
   * const status = BDDeviceStatus.OPERATIONAL;
   * ```
   */
  DeviceStatus as BDDeviceStatus,
  
  /**
   * BACnet application tag enumeration
   * 
   * Defines the data types used in BACnet application layer encoding,
   * essential for proper data serialization and deserialization.
   * 
   * @example
   * ```typescript
   * import { BDApplicationTag } from './enums';
   * const tag = BDApplicationTag.REAL;
   * ```
   */
  ApplicationTag as BDApplicationTag,
  
  /**
   * BACnet engineering units enumeration
   * 
   * Standard units of measurement used in BACnet for physical quantities,
   * ensuring consistent unit representation across the system.
   * 
   * @example
   * ```typescript
   * import { BDEngineeringUnit } from './enums';
   * const unit = BDEngineeringUnit.DEGREES_CELSIUS;
   * ```
   */
  EngineeringUnits as BDEngineeringUnit,
  
  /**
   * BACnet property identifier enumeration
   * 
   * Identifies all the standard properties that BACnet objects can have,
   * enabling property-based access to object data.
   * 
   * @example
   * ```typescript
   * import { BDPropertyIdentifier } from './enums';
   * const property = BDPropertyIdentifier.PRESENT_VALUE;
   * ```
   */
  PropertyIdentifier as BDPropertyIdentifier,
  
  /**
   * BACnet character string encoding enumeration
   * 
   * Defines the character encoding methods supported by BACnet
   * for string data representation.
   * 
   * @example
   * ```typescript
   * import { BDCharacterStringEncoding } from './enums';
   * const encoding = BDCharacterStringEncoding.UTF8;
   * ```
   */
  CharacterStringEncoding as BDCharacterStringEncoding,
} from '@innovation-system/node-bacnet'
