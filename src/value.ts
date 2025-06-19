
import type {
  BACNetAppData,
  ApplicationTag,
  ApplicationTagValueTypeMap,
} from '@innovation-system/node-bacnet';

/**
 * Representation of a BACnet value.
 * 
 * This interface extends the BACNetAppData interface from the underlying BACnet library
 * and provides a type-safe way to represent BACnet values with their associated tags.
 * 
 * @template Tag - The ApplicationTag that categorizes this value
 * @template Type - The JavaScript type associated with the Tag, derived from ApplicationTagValueType
 */
export interface BDValue<Tag extends ApplicationTag = ApplicationTag, Type extends BDApplicationTagValueType[Tag] = BDApplicationTagValueType[Tag]> extends BACNetAppData<Tag, Type> { 

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
export interface BDApplicationTagValueType extends ApplicationTagValueTypeMap { 
  [ApplicationTag.OCTET_STRING]: never;
  [ApplicationTag.EMPTYLIST]: never;
  [ApplicationTag.WEEKNDAY]: never;
  [ApplicationTag.DATERANGE]: never;
  [ApplicationTag.DATETIME]: never;
  [ApplicationTag.ERROR]: never;
  [ApplicationTag.DEVICE_OBJECT_PROPERTY_REFERENCE]: never;
  [ApplicationTag.DEVICE_OBJECT_REFERENCE]: never;
  [ApplicationTag.OBJECT_PROPERTY_REFERENCE]: never;
  [ApplicationTag.DESTINATION]: never;
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
