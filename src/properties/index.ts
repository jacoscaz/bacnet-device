
import { type ApplicationTagValueType } from '../value.js';
import { type ApplicationTag } from '../enums/index.js';
import { BACnetSingletProperty } from './singlet.js';
import { BACnetListProperty } from './list.js';

export { BACnetSingletProperty, BACnetListProperty };

export type BACnetProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag]> = 
  | BACnetSingletProperty<Tag, Type> 
  | BACnetListProperty<Tag, Type>;
