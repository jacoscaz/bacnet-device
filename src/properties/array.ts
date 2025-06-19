
/**
 * BACnet array property implementation module
 * 
 * This module provides the implementation for BACnet properties
 * that contain multiple values in an array.
 * 
 * @module
 */

import fastq from 'fastq';

import { 
  type BDValue, 
  type BDApplicationTagValueType,
} from '../value.js';
import { BDEvented } from '../evented.js';
import { BDError } from '../errors.js';
import { PropertyIdentifier, ErrorCode, ErrorClass, ApplicationTag } from '@innovation-system/node-bacnet';

/**
 * Events that can be emitted by a BACnet array property
 * 
 * This interface defines the events that can be triggered by BACnet array properties
 * when their values change.
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export interface BDArrayPropertyEvents<Tag extends ApplicationTag, Type extends BDApplicationTagValueType[Tag] = BDApplicationTagValueType[Tag]> { 
  /** Emitted before a property value changes */
  beforecov: [property: BDArrayProperty<Tag, Type>, raw: BDValue<Tag, Type>[]],
  
  /** Emitted after a property value has changed */
  aftercov: [property: BDArrayProperty<Tag, Type>, raw: BDValue<Tag, Type>[]],
}

/**
 * Implementation of a BACnet property with multiple values (array)
 * 
 * This class represents a BACnet property that contains multiple values in an array.
 * It manages the property's values and handles read/write operations and change notifications.
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 * @extends BDEvented<BDArrayPropertyEvents<Tag, Type>>
 */
export class BDArrayProperty<Tag extends ApplicationTag, Type extends BDApplicationTagValueType[Tag] = BDApplicationTagValueType[Tag]> extends BDEvented<BDArrayPropertyEvents<Tag, Type>> {
  
  /** Indicates this is not a list/array property (BACnet semantic, not JavaScript array) */
  readonly list: false;
  
  /** The BACnet application tag for this property's values */
  readonly type: Tag;
  
  /** Whether this property can be written to */
  readonly writable: boolean;
  
  /** Whether this property's entire value can be set at once */
  readonly settable: boolean;
  
  /** The BACnet property identifier */
  readonly identifier: PropertyIdentifier;
  
  /** 
   * The current values of this property 
   * @private
   */
  #value: BDValue<Tag, Type>[] | (() => BDValue<Tag, Type>[]);
  
  /**
   * Queue for serializing value changes
   * @private
   */
  #queue: fastq.queueAsPromised<BDValue<Tag, Type>[]>;
  
  /**
   * Creates a new BACnet array property
   * 
   * @param identifier - The BACnet property identifier
   * @param type - The BACnet application tag for this property's values
   * @param writable - Whether this property can be written to
   * @param value - Optional initial values for this property. If provided, the property is not settable as a whole.
   */
  constructor(identifier: PropertyIdentifier, type: Tag, writable: boolean, value: BDValue<Tag, Type>[] | (() => BDValue<Tag, Type>[])) {
    super();
    this.list = false;
    this.type = type;
    this.settable = typeof value !== 'function';
    this.writable = typeof value !== 'function' && writable;
    this.identifier = identifier;
    this.#value = value;
    this.#queue = fastq.promise(this.#worker, 1)
  }
  
  /**
   * Gets the current values of this property
   * 
   * @returns An array of the current property values
   */
  getValue(): Type[] {
    return (typeof this.#value === 'function' ? this.#value() : this.#value)
      .map(v => v.value);
  }
  
  /**
   * Sets new values for this property
   * 
   * This method queues the value changes to ensure proper event
   * notification and serialization of changes.
   * 
   * @param value - The new values to set
   * @returns A promise that resolves when the values have been set
   * @throws BACnetError if the property is not settable as a whole
   */
  async setValue(value: Type[]): Promise<void> {
    if (!this.settable) { 
      throw new BDError('not settable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    await this.#queue.push(value.map(v => ({ type: this.type, value: v })));
  }
  
  /**
   * Reads the current values of this property for BACnet operations
   * 
   * This internal method is used by BACnet objects to read the property values
   * when handling BACnet protocol operations.
   * 
   * @returns The current property values in BACnet format
   * @internal
   */
  ___readValue(): BDValue<Tag, Type>[] {
    return typeof this.#value === 'function' ? this.#value() : this.#value;
  }
  
  /**
   * Writes new values to this property for BACnet operations
   * 
   * This internal method is used by BACnet objects to write the property values
   * when handling BACnet protocol operations.
   * 
   * @param value - The new values to write in BACnet format (single value or array)
   * @returns A promise that resolves when the values have been set
   * @throws BACnetError if the property is not writable or the value types are invalid
   * @internal
   */
  async ___writeValue(value: BDValue<Tag, Type> | BDValue<Tag, Type>[]): Promise<void> { 
    if (!this.writable || !this.settable) { 
      throw new BDError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (!Array.isArray(value)) { 
      value = [value];
    }
    for (const { type } of value) { 
      if (type !== this.type) { 
        throw new BDError('type mismatch', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
      }  
    }
    await this.#queue.push(value);
  }
  
  /**
   * Worker function for processing the value change queue
   * 
   * This method processes each value change and triggers the appropriate events.
   * 
   * @param value - The new values to set
   * @private
   */
  #worker = async (value: BDValue<Tag, Type>[]) => { 
    await this.trigger('beforecov', this, value);
    this.#value = value;
    await this.trigger('aftercov', this, value);
  };
 
}
