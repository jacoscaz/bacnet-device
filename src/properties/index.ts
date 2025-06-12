
/**
 * BACnet property implementations module
 * 
 * This module provides the core property implementations for BACnet objects.
 * Properties are the data elements that make up BACnet objects, and this module
 * defines the base types and interfaces for them.
 * 
 * @module
 */

import { type BDApplicationTagValueType } from '../value.js';
import { type BDApplicationTag } from '../enums/index.js';
import { BDSingletProperty } from './singlet.js';
import { BDArrayProperty } from './array.js';

/**
 * Export the concrete property implementations
 */
export { BDSingletProperty, BDArrayProperty };

/**
 * Union type representing any BACnet property
 * 
 * This type represents either a BACnet singlet property (single value)
 * or a BACnet array property (multiple values).
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export type BDProperty<Tag extends BDApplicationTag, Type extends BDApplicationTagValueType[Tag] = BDApplicationTagValueType[Tag]> = 
  | BDSingletProperty<Tag, Type> 
  | BDArrayProperty<Tag, Type>;
