
import type { BACnetValue, ApplicationTagValueType } from './value.js';

import { Evented } from './evented.js';
import { BACnetError } from './errors.js';

import { PropertyIdentifier, ErrorCode, ErrorClass, ApplicationTag } from './enums/index.js';
import { isDeepStrictEqual } from 'node:util';

export type BACnetProperty = BACnetScalarProperty<any> | BACnetListProperty;

export interface BACnetPropertyEvents<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> { 
  pre_cov: [property: BACnetProperty, nextValue: BACnetValue<Tag, Type> | BACnetValue<Tag, Type>[]],
  post_cov: [property: BACnetProperty, newValue: BACnetValue<Tag, Type> | BACnetValue<Tag, Type>[]],
}

export class BACnetScalarProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> extends Evented<BACnetPropertyEvents<Tag, Type>> {
  
  readonly list: false;
  readonly type: Tag;
  readonly writable: boolean;
  readonly identifier: PropertyIdentifier;
  
  #value: BACnetValue<Tag, Type>;
  #array: [BACnetValue<Tag, Type>];
  
  constructor(identifier: PropertyIdentifier, type: Tag, writable: boolean, value: Type) {
    super();
    this.list = false;
    this.type = type;
    this.writable = writable;
    this.identifier = identifier;
    this.#value = { type, value };
    this.#array = [this.#value];
  }
  
  async getValue(): Promise<Type> {
    return this.#value.value;
  }
  
  async setValue(value: Type, cov: boolean = true): Promise<void> {
    this.#value.value = value;
    if (cov) {
      await this.trigger('post_cov', this, this.#value);
    }
  }
  
  async ___readValue(): Promise<BACnetValue<Tag, Type>> {
    return this.#value;
  }
  
  async ___readValueAsList(): Promise<[BACnetValue<Tag, Type>]> { 
    return this.#array;
  }
  
  async ___writeValue(value: BACnetValue<Tag, Type> | BACnetValue<Tag, Type>[], cov: boolean = true): Promise<void> { 
    if (!this.writable) { 
      throw new BACnetError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (Array.isArray(value)) { 
      if (value.length !== 1) {
        throw new BACnetError('not a list', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
      } else { 
        value = value[0];
      }
    }
    if (value.type !== this.type) { 
      throw new BACnetError('not a list', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
    }
    await this.trigger('pre_cov', this, value);
    // TODO: we should also make sure that the value type (number, string, ... ) matches expectations
    this.#value = value;
    if (cov) { 
      await this.trigger('post_cov', this, value);
    }
  }
 
}

export class BACnetListProperty extends Evented<BACnetPropertyEvents<any, any>> { 
  
  readonly list: true;
  readonly writable: boolean;
  readonly identifier: PropertyIdentifier;
  
  #value: BACnetValue[];
  
  constructor(identifier: PropertyIdentifier, writable: boolean, value: BACnetValue[]) {
    super();
    this.list = true;
    this.writable = writable;
    this.identifier = identifier;
    this.#value = value;
  }
  
  async setValue(value: BACnetValue[], cov: boolean = true): Promise<void> { 
    this.#value = value;
    if (cov) {
      await this.trigger('post_cov', this, this.#value);
    }
  }
  
  async getValue(): Promise<BACnetValue[]> {
    return this.#value;
  }
  
  async ___onValueChange(property: BACnetListProperty, data: BACnetValue[]): Promise<void> { 
    
  }
  
  
  async ___writeValue(value: BACnetValue | BACnetValue[], cov: boolean = true): Promise<void> { 
    if (!this.writable) { 
      throw new BACnetError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (!Array.isArray(value)) { 
      value = [value];
    }
    this.setValue(value, cov);
  }
  
  async ___readValue(): Promise<BACnetValue[]> {
    return this.#value;
  }
  
  async ___readValueAsList(): Promise<BACnetValue[]> { 
    return this.#value;
  }
  
  async ___readElementAtIndex(idx: number): Promise<BACnetValue> {
    idx -= 1;
    if (idx < 0 || idx >= this.#value.length) { 
      throw new BACnetError('out of bounds', ErrorCode.LIST_ELEMENT_NOT_FOUND, ErrorClass.PROPERTY);
    }
    return this.#value[idx];
  }
  
  async ___writeElementAtIndex(idx: number, value: BACnetValue, cov: boolean = true): Promise<void> { 
    idx -= 1;
    if (idx < 0 || idx >= this.#value.length) { 
      throw new BACnetError('out of bounds', ErrorCode.LIST_ELEMENT_NOT_FOUND, ErrorClass.PROPERTY);
    }
    this.#value[idx] = value;
    if (cov) { 
      await this.trigger('post_cov', this, this.#value);
    }
  }
  
  async ___addElements(values: BACnetValue[], cov: boolean = true): Promise<void> {
    this.#value.push(...values);
    if (cov) { 
      await this.trigger('post_cov', this, this.#value);
    }
  }
  
  async ___removeElements(values: BACnetValue[], cov: boolean = true): Promise<void> { 
    for (const value of values) { 
      this.#value = this.#value.filter(v => !isDeepStrictEqual(v, value));
    }
    if (cov) { 
      await this.trigger('post_cov', this, this.#value);
    }
  }
  
}
