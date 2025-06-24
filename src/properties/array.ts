
/**
 * BACnet array property implementation module
 * 
 * This module provides the implementation for BACnet properties
 * that contain multiple values in an array.
 * 
 * @module
 */

import {
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
} from '@innovation-system/node-bacnet';
 
import { BDError } from '../errors.js';
import { BDAbstractProperty, BDPropertyType } from './abstract.js';

import { MAX_ARRAY_INDEX } from '../constants.js';


/**
 * Implementation of a BACnet property with multiple values (array)
 * 
 * This class represents a BACnet property that contains multiple values in an array.
 * It manages the property's values and handles read/write operations and change notifications.
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 * @extends AsyncEventEmitter<BDArrayPropertyEvents<Tag, Type>>
 */
 export class BDArrayProperty<
   Tag extends ApplicationTag, 
   Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]
 > extends BDAbstractProperty<Tag, Type, BACNetAppData<Tag, Type>[]> {
   
   type: BDPropertyType = BDPropertyType.ARRAY;
  
  /**
   * Reads the current values of this property for BACnet operations
   * 
   * This internal method is used by BACnet objects to read the property values
   * when handling BACnet protocol operations.
   * 
   * @returns The current property values in BACnet format
   * @internal
   */
  ___readData(index: number): BACNetAppData<ApplicationTag.UNSIGNED_INTEGER> | BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[] {
    const data = this.getData();
    if (index === 0) {
      return { type: ApplicationTag.UNSIGNED_INTEGER, value: data.length };
    }
    if (index === MAX_ARRAY_INDEX){
      return data;
    }
    if (index > data.length) {
      throw new BDError('index out of range', ErrorCode.INVALID_ARRAY_INDEX, ErrorClass.PROPERTY);
    }
    return data[index - 1];
  }
  
  /**
   * Writes new values to this property for BACnet operations
   * 
   * This internal method is used by BACnet objects to write the property values
   * when handling BACnet protocol operations.
   * 
   * @param data - The new values to write in BACnet format (single value or array)
   * @returns A promise that resolves when the values have been set
   * @throws BACnetError if the property is not writable or the value types are invalid
   * @internal
   */
  async ___writeData(data: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[]): Promise<void> { 
    if (!this.writable) { 
      throw new BDError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (!Array.isArray(data)) { 
      data = [data];
    }
    await this.___queueData(data);
  }
  
}
