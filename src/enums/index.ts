/**
 * BACnet enumeration values module
 * 
 * This module exports all the standard BACnet enumeration values used throughout
 * the library. These enumerations represent the standardized values defined in
 * the BACnet protocol specification.
 * 
 * @module
 */
 
export { 
  TimeStamp as BDTimestampType,
  ErrorCode as BDErrorCode,
  ErrorClass as BDErrorClass,
  EventState as BDEventState,
  ObjectType as BDObjectType,
  Reliability as BDReliability,
  Segmentation as BDSegmentation,
  DeviceStatus as BDDeviceStatus,
  ApplicationTag as BDApplicationTag,
  EngineeringUnits as BDEngineeringUnit,
  PropertyIdentifier as BDPropertyIdentifier,
  CharacterStringEncoding as BDCharacterStringEncoding,
} from '@innovation-system/node-bacnet'
