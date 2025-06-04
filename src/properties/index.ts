
import { type ApplicationTagValueType } from '../value.js';
import { type ApplicationTag } from '../enums/index.js';
import { BACnetSingletProperty } from './singlet.js';
import { BACnetArrayProperty } from './array.js';

export { BACnetSingletProperty, BACnetArrayProperty };

export type BACnetProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag]> = 
  | BACnetSingletProperty<Tag, Type> 
  | BACnetArrayProperty<Tag, Type>;
