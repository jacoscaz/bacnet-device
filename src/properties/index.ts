
/**
 * BACnet property implementations module
 * 
 * This module provides the core property implementations for BACnet objects.
 * Properties are the data elements that make up BACnet objects, and this module
 * defines the base types and interfaces for them.
 * 
 * @module
 */
 
import { 
  type ApplicationTag,
  type ApplicationTagValueTypeMap,
} from '@innovation-system/node-bacnet';
import { type BDSingletPropertyEvents, BDSingletProperty } from './singlet.js';
import { type BDArrayPropertyEvents, BDArrayProperty } from './array.js';

/**
 * Export the concrete property implementations
 */
export { 
  type BDSingletPropertyEvents,
  type BDArrayPropertyEvents,
  BDSingletProperty, 
  BDArrayProperty, 
};

/**
 * Union type representing any BACnet property
 * 
 * This type represents either a BACnet singlet property (single value)
 * or a BACnet array property (multiple values).
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export type BDProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]> = 
  | BDSingletProperty<Tag, Type> 
  | BDArrayProperty<Tag, Type>;
