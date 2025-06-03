
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
} from './enums/index.js';

import type { StatusFlagsBitString } from './bitstrings.js';

/**
 * Representation of a BACnet value.
 */
export interface BACnetValue<Tag extends ApplicationTag = ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> extends BACNetAppData { 
  type: Tag;
  value: Type;
  encoding?: CharacterStringEncoding;
}

/**
 * Map between BACnet Application Tags and native JavaScript types.
 * Entries mapping to the `never` type are not yet supported.
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
  [ApplicationTag.BIT_STRING]: StatusFlagsBitString;
  [ApplicationTag.ENUMERATED]: ObjectType | EventState | EngineeringUnit | PropertyIdentifier;
  [ApplicationTag.DATE]: never;
  [ApplicationTag.TIME]: never;
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
  [ApplicationTag.COV_SUBSCRIPTION]: never;
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
