
import { type ApplicationTagValueType } from '../value.js';
import { type ApplicationTag } from '../enums/index.js';
import { BACnetScalarProperty } from './scalar.js';
import { BACnetListProperty } from './list.js';

export { BACnetScalarProperty, BACnetListProperty };

export type BACnetProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag]> = 
  | BACnetScalarProperty<Tag, Type> 
  | BACnetListProperty<Tag, Type>;
