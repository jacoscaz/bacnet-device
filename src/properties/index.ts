
/**
 * BACnet property implementations module
 * 
 * This module provides the core property implementations for BACnet objects.
 * Properties are the data elements that make up BACnet objects, and this module
 * defines the base types and interfaces for them.
 * 
 * @module
 */

import { type ApplicationTagValueType } from '../value.js';
import { type ApplicationTag } from '../enums/index.js';
import { BACnetSingletProperty } from './singlet.js';
import { BACnetArrayProperty } from './array.js';

/**
 * Export the concrete property implementations
 */
export { BACnetSingletProperty, BACnetArrayProperty };

/**
 * Union type representing any BACnet property
 * 
 * This type represents either a BACnet singlet property (single value)
 * or a BACnet array property (multiple values).
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export type BACnetProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag]> = 
  | BACnetSingletProperty<Tag, Type> 
  | BACnetArrayProperty<Tag, Type>;
