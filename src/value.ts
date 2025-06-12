
import type {
  BACNetAppData,
  BACNetObjectID,
  BACNetTimestamp,
} from '@innovation-system/node-bacnet';

import type { 
  BDApplicationTag, 
  BDCharacterStringEncoding, 
  BDObjectType,
  BDEventState,
  BDEngineeringUnit,
  BDPropertyIdentifier,
  BDDeviceStatus,
  BDSegmentation,
  BDReliability,
  BDTimestampType,
} from './enums/index.js';

import type { BDSupportedObjectTypesBitString, BDSupportedServicesBitString, BDStatusFlagsBitString } from './bitstrings/index.js';
import type { BDSubscription } from './objects/device/types.js';

/**
 * Representation of a BACnet value.
 * 
 * This interface extends the BACNetAppData interface from the underlying BACnet library
 * and provides a type-safe way to represent BACnet values with their associated tags.
 * 
 * @template Tag - The ApplicationTag that categorizes this value
 * @template Type - The JavaScript type associated with the Tag, derived from ApplicationTagValueType
 */
export interface BDValue<Tag extends BDApplicationTag = BDApplicationTag, Type extends BDApplicationTagValueType[Tag] = BDApplicationTagValueType[Tag]> extends BACNetAppData { 
  /** The BACnet application tag for this value */
  type: Tag;
  
  /** The actual value with type corresponding to the application tag */
  value: Type;
  
  /** Optional character string encoding, used only for CHARACTER_STRING type values */
  encoding?: BDCharacterStringEncoding;
}

export interface BDTimestamp<T extends BDTimestampType> extends BACNetTimestamp {
  type: BDTimestampType,
  value: T extends BDTimestampType.DATETIME ? Date
    : T extends BDTimestampType.SEQUENCE_NUMBER ? number
    : T extends BDTimestampType.TIME ? Date
    : never;
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
export interface BDApplicationTagValueType { 
  [BDApplicationTag.NULL]: null;
  [BDApplicationTag.BOOLEAN]: boolean;
  [BDApplicationTag.UNSIGNED_INTEGER]: number;
  [BDApplicationTag.SIGNED_INTEGER]: number;
  [BDApplicationTag.REAL]: number;
  [BDApplicationTag.DOUBLE]: number;
  [BDApplicationTag.OCTET_STRING]: never;
  [BDApplicationTag.CHARACTER_STRING]: string;
  [BDApplicationTag.BIT_STRING]: BDStatusFlagsBitString | BDSupportedObjectTypesBitString | BDSupportedServicesBitString;
  [BDApplicationTag.ENUMERATED]: BDObjectType | BDEventState | BDEngineeringUnit | BDPropertyIdentifier | BDDeviceStatus | BDSegmentation | BDReliability;
  [BDApplicationTag.DATE]: Date;
  [BDApplicationTag.TIME]: Date;
  [BDApplicationTag.OBJECTIDENTIFIER]: BACNetObjectID;
  [BDApplicationTag.EMPTYLIST]: never;
  [BDApplicationTag.WEEKNDAY]: never;
  [BDApplicationTag.DATERANGE]: never;
  [BDApplicationTag.DATETIME]: never;
  [BDApplicationTag.TIMESTAMP]: BACNetTimestamp;
  [BDApplicationTag.ERROR]: never;
  [BDApplicationTag.DEVICE_OBJECT_PROPERTY_REFERENCE]: never;
  [BDApplicationTag.DEVICE_OBJECT_REFERENCE]: never;
  [BDApplicationTag.OBJECT_PROPERTY_REFERENCE]: never;
  [BDApplicationTag.DESTINATION]: never;
  [BDApplicationTag.RECIPIENT]: { network: number; address: number[]; };
  [BDApplicationTag.COV_SUBSCRIPTION]: BDSubscription;
  [BDApplicationTag.CALENDAR_ENTRY]: never;
  [BDApplicationTag.WEEKLY_SCHEDULE]: never;
  [BDApplicationTag.SPECIAL_EVENT]: never;
  [BDApplicationTag.READ_ACCESS_SPECIFICATION]: never;
  [BDApplicationTag.READ_ACCESS_RESULT]: never;
  [BDApplicationTag.LIGHTING_COMMAND]: never;
  [BDApplicationTag.CONTEXT_SPECIFIC_DECODED]: never;
  [BDApplicationTag.CONTEXT_SPECIFIC_ENCODED]: never;
  [BDApplicationTag.LOG_RECORD]: never;
}
