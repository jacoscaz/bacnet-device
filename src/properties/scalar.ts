
import fastq from 'fastq';

import { 
  type BACnetValue, 
  type ApplicationTagValueType,
} from '../value.js';
import { Evented } from '../evented.js';
import { BACnetError } from '../errors.js';
import { PropertyIdentifier, ErrorCode, ErrorClass, ApplicationTag } from '../enums/index.js';

export interface ScalarPropertyEvents<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> { 
  beforecov: [property: BACnetScalarProperty<Tag, Type>, value: BACnetValue<Tag, Type>],
  aftercov: [property: BACnetScalarProperty<Tag, Type>, value: BACnetValue<Tag, Type>],
}

export class BACnetScalarProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> extends Evented<ScalarPropertyEvents<Tag, Type>> {
  
  readonly list: false;
  readonly type: Tag;
  readonly writable: boolean;
  readonly identifier: PropertyIdentifier;
  
  #value: BACnetValue<Tag, Type>;
  #queue: fastq.queueAsPromised<BACnetValue<Tag, Type>>;
  
  constructor(identifier: PropertyIdentifier, type: Tag, writable: boolean, value: Type) {
    super();
    this.list = false;
    this.type = type;
    this.writable = writable;
    this.identifier = identifier;
    this.#value = { type, value };
    this.#queue = fastq.promise(this.#worker, 1)
  }
  
  getValue(): Type {
    return this.#value.value;
  }
  
  async setValue(value: Type): Promise<void> {
    await this.#queue.push({ type: this.type, value });
  }
  
  ___readValue(): BACnetValue<Tag, Type> {
    return this.#value;
  }
  
  async ___writeValue(value: BACnetValue<Tag, Type> | BACnetValue<Tag, Type>[]): Promise<void> { 
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
    await this.#queue.push(value);
  }
  
  #worker = async (value: BACnetValue<Tag, Type>) => { 
    await this.trigger('beforecov', this, value);
    this.#value = value;
    await this.trigger('aftercov', this, value);
  };
 
}