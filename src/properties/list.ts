
import fastq from 'fastq';

import { 
  type BACnetValue, 
  type ApplicationTagValueType,
} from '../value.js';
import { Evented } from '../evented.js';
import { BACnetError } from '../errors.js';
import { PropertyIdentifier, ErrorCode, ErrorClass, ApplicationTag } from '../enums/index.js';

export interface ListPropertyEvents<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> { 
  beforecov: [property: BACnetListProperty<Tag, Type>, raw: BACnetValue<Tag, Type>[]],
  aftercov: [property: BACnetListProperty<Tag, Type>, raw: BACnetValue<Tag, Type>[]],
}

export class BACnetListProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueType[Tag] = ApplicationTagValueType[Tag]> extends Evented<ListPropertyEvents<Tag, Type>> {
  
  readonly list: false;
  readonly type: Tag;
  readonly writable: boolean;
  readonly settable: boolean;
  readonly identifier: PropertyIdentifier;
  
  #value: BACnetValue<Tag, Type>[];
  #queue: fastq.queueAsPromised<BACnetValue<Tag, Type>[]>;
  
  constructor(identifier: PropertyIdentifier, type: Tag, writable: boolean, value?: BACnetValue<Tag, Type>[]) {
    super();
    this.list = false;
    this.type = type;
    this.settable = !value;
    this.writable = writable;
    this.identifier = identifier;
    this.#value = value ?? [];
    this.#queue = fastq.promise(this.#worker, 1)
  }
  
  getValue(): Type[] {
    return this.#value.map(v => v.value);
  }
  
  async setValue(value: Type[]): Promise<void> {
    if (!this.settable) { 
      throw new BACnetError('not settable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    await this.#queue.push(value.map(v => ({ type: this.type, value: v })));
  }
  
  ___readValue(): BACnetValue<Tag, Type>[] {
    return this.#value;
  }
  
  async ___writeValue(value: BACnetValue<Tag, Type> | BACnetValue<Tag, Type>[]): Promise<void> { 
    if (!this.writable) { 
      throw new BACnetError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (!Array.isArray(value)) { 
      value = [value];
    }
    for (const { type } of value) { 
      if (type !== this.type) { 
        throw new BACnetError('type mismatch', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
      }  
    }
    await this.#queue.push(value);
  }
  
  #worker = async (value: BACnetValue<Tag, Type>[]) => { 
    await this.trigger('beforecov', this, value);
    this.#value = value;
    await this.trigger('aftercov', this, value);
  };
 
}
