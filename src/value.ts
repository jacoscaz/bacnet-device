
import type {
  BACNetAppData,
  BACNetObjectID,
} from '@innovation-system/node-bacnet';

import type { 
  ApplicationTag, 
  CharacterStringEncoding, 
  ObjectType,
  EventState,
  EngineeringUnit,
  PropertyIdentifier,
  DeviceStatus,
  Segmentation,
  Reliability,
} from './enums/index.js';

import type { SupportedObjectTypesBitString, SupportedServicesBitString, StatusFlagsBitString } from './bitstrings/index.js';
import type { BACnetSubscription } from './objects/device/types.js';

/**
 * Representation of a BACnet value.
 * 
 * This interface extends the BACNetAppData interface from the underlying BACnet library
 * and provides a type-safe way to represent BACnet values with their associated tags.
 * 
 * @template Tag - The ApplicationTag that categorizes this value
 * @template Type - The JavaScript type associated with the Tag, derived from ApplicationTagValueType
 */
export interface BACnetValue<Tag extends ApplicationTag = ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> extends BACNetAppData { 
  /** The BACnet application tag for this value */
  type: Tag;
  
  /** The actual value with type corresponding to the application tag */
  value: Type;
  
  /** Optional character string encoding, used only for CHARACTER_STRING type values */
  encoding?: CharacterStringEncoding;
}

/**
 * Map between BACnet Application Tags and native JavaScript types.
 * 
 * This interface defines the mapping between each BACnet ApplicationTag
 * and its corresponding JavaScript/TypeScript type. This mapping is used
 * throughout the library to ensure type safety when working with BACnet values.
 * 
 * Entries mapping to the `never` type are not yet supported by this implementation.
 */
export interface ApplicationTagValueType { 
  [ApplicationTag.NULL]: null;
  [ApplicationTag.BOOLEAN]: boolean;
  [ApplicationTag.UNSIGNED_INTEGER]: number;
  [ApplicationTag.SIGNED_INTEGER]: number;
  [ApplicationTag.REAL]: number;
  [ApplicationTag.DOUBLE]: number;
  [ApplicationTag.OCTET_STRING]: never;
  [ApplicationTag.CHARACTER_STRING]: string;
  [ApplicationTag.BIT_STRING]: StatusFlagsBitString | SupportedObjectTypesBitString | SupportedServicesBitString;
  [ApplicationTag.ENUMERATED]: ObjectType | EventState | EngineeringUnit | PropertyIdentifier | DeviceStatus | Segmentation | Reliability;
  [ApplicationTag.DATE]: Date;
  [ApplicationTag.TIME]: Date;
  [ApplicationTag.OBJECTIDENTIFIER]: BACNetObjectID;
  [ApplicationTag.EMPTYLIST]: never;
  [ApplicationTag.WEEKNDAY]: never;
  [ApplicationTag.DATERANGE]: never;
  [ApplicationTag.DATETIME]: never;
  [ApplicationTag.TIMESTAMP]: never;
  [ApplicationTag.ERROR]: never;
  [ApplicationTag.DEVICE_OBJECT_PROPERTY_REFERENCE]: never;
  [ApplicationTag.DEVICE_OBJECT_REFERENCE]: never;
  [ApplicationTag.OBJECT_PROPERTY_REFERENCE]: never;
  [ApplicationTag.DESTINATION]: never;
  [ApplicationTag.RECIPIENT]: never;
  [ApplicationTag.COV_SUBSCRIPTION]: BACnetSubscription;
  [ApplicationTag.CALENDAR_ENTRY]: never;
  [ApplicationTag.WEEKLY_SCHEDULE]: never;
  [ApplicationTag.SPECIAL_EVENT]: never;
  [ApplicationTag.READ_ACCESS_SPECIFICATION]: never;
  [ApplicationTag.READ_ACCESS_RESULT]: never;
  [ApplicationTag.LIGHTING_COMMAND]: never;
  [ApplicationTag.CONTEXT_SPECIFIC_DECODED]: never;
  [ApplicationTag.CONTEXT_SPECIFIC_ENCODED]: never;
  [ApplicationTag.LOG_RECORD]: never;
}
