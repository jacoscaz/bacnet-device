
/**
 * BACnet singlet property implementation module
 * 
 * This module provides the implementation for BACnet properties
 * that contain a single value (as opposed to array properties).
 * 
 * @module
 */

import {
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
  type PropertyIdentifier,
  type CharacterStringEncoding,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
} from '@innovation-system/node-bacnet';

import { BDError } from '../errors.js';
import { BDAbstractProperty, BDPropertyType, type BDPropertyAccessContext } from './abstract.js';



/**
 * Implementation of a BACnet property with a single value.
 * 
 * @typeParam Tag - The BACnet application tag for the property value
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export class BDSingletProperty<
  Tag extends ApplicationTag, 
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]
> extends BDAbstractProperty<Tag, Type, BACNetAppData<Tag, Type>> {
  
  type: BDPropertyType = BDPropertyType.SINGLET;
  
  constructor(
    identifier: PropertyIdentifier, 
    type: Tag, 
    writable: boolean, 
    value: Type | ((ctx: BDPropertyAccessContext) => Type), 
    encoding?: CharacterStringEncoding,
  ) { 
    super(identifier, writable, typeof value === 'function' 
      ? (ctx) => ({ type, value: (value as Function)(ctx), encoding })
      : { type, value, encoding }
    );
  }
  
  getValue(): Type {
    return this.getData().value;
  }
  
  async setValue(value: Type): Promise<void> {
    await this.setData({ ...this.getData(), value });
  }
  
  
  /**
   * 
   * @internal
   */
  ___readData(index: number): BACNetAppData | BACNetAppData[] {
    return this.getData();
  }
  
  /**
   * Writes a new value to this property for BACnet operations
   * 
   * This internal method is used by BACnet objects to write the property value
   * when handling BACnet protocol operations.
   * 
   * @param value - The new value to write in BACnet format
   * @returns A promise that resolves when the value has been set
   * @throws BACnetError if the property is not writable or the value type is invalid
   * @internal
   */
  async ___writeData(value: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[]): Promise<void> { 
    if (!this.writable) { 
      throw new BDError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (Array.isArray(value)) { 
      if (value.length !== 1) {
        throw new BDError('not a list', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
      } else { 
        value = value[0];
      }
    }
    await this.___updateData(value);
  }
  
 
}