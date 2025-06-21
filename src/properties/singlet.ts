
/**
 * BACnet singlet property implementation module
 * 
 * This module provides the implementation for BACnet properties
 * that contain a single value (as opposed to array properties).
 * 
 * @module
 */

import fastq from 'fastq';

import { BDEvented } from '../evented.js';
import { BDError } from '../errors.js';

import { 
  type BACNetAppData,
  type ApplicationTagValueTypeMap,
  PropertyIdentifier, 
  ErrorCode, 
  ErrorClass, 
  ApplicationTag,
} from '@innovation-system/node-bacnet';

/**
 * Events that can be emitted by a BACnet singlet property
 * 
 * This interface defines the events that can be triggered by BACnet singlet properties
 * when their values change.
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export interface BDSingletPropertyEvents<Tag extends ApplicationTag, Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]> { 
  /** Emitted before a property value changes */
  beforecov: [property: BDSingletProperty<Tag, Type>, value: BACNetAppData<Tag, Type>],
  
  /** Emitted after a property value has changed */
  aftercov: [property: BDSingletProperty<Tag, Type>, value: BACNetAppData<Tag, Type>],
}

/**
 * Implementation of a BACnet property with a single value
 * 
 * This class represents a BACnet property that contains a single value (not an array).
 * It manages the property's value and handles read/write operations and change notifications.
 * 
 * @typeParam Tag - The BACnet application tag for the property value
 * @typeParam Type - The JavaScript type corresponding to the application tag
 * @extends BDEvented<BDSingletPropertyEvents<Tag, Type>>
 */
export class BDSingletProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]> extends BDEvented<BDSingletPropertyEvents<Tag, Type>> {
  
  /** Indicates this is not a list/array property */
  readonly list: false;
  
  /** The BACnet application tag for this property's value */
  readonly type: Tag;
  
  /** Whether this property can be written to */
  readonly writable: boolean;
  
  readonly settable: boolean;
  
  /** The BACnet property identifier */
  readonly identifier: PropertyIdentifier;
  
  /** 
   * The current value of this property 
   * @private
   */
  #value: BACNetAppData<Tag, Type> | (() => BACNetAppData<Tag, Type>);
  
  /**
   * Queue for serializing value changes
   * @private
   */
  #queue: fastq.queueAsPromised<BACNetAppData<Tag, Type>>;
  
  /**
   * Creates a new BACnet singlet property
   * 
   * @param identifier - The BACnet property identifier
   * @param type - The BACnet application tag for this property's value
   * @param writable - Whether this property can be written to
   * @param value - The initial value for this property
   */
  constructor(identifier: PropertyIdentifier, type: Tag, writable: boolean, value: Type | (() => BACNetAppData<Tag, Type>)) {
    super();
    this.list = false;
    this.type = type;
    this.writable = typeof value !== 'function' && writable;
    this.settable = typeof value !== 'function';
    this.identifier = identifier;
    this.#value = typeof value === 'function' ? value :{ type, value };
    this.#queue = fastq.promise(this.#worker, 1)
  }
  
  /**
   * Gets the current value of this property
   * 
   * @returns The current property value
   */
  getValue(): Type {
    return typeof this.#value === 'function' ? this.#value().value : this.#value.value;
  }
  
  /**
   * Sets a new value for this property
   * 
   * This method queues the value change to ensure proper event
   * notification and serialization of changes.
   * 
   * @param value - The new value to set
   * @returns A promise that resolves when the value has been set
   */
  async setValue(value: Type): Promise<void> {
    if (this.settable) {
      await this.#queue.push({ type: this.type, value });
    } else { 
      throw new Error(`Property ${this.identifier} is not settable`);
    }
  }
  
  /**
   * Reads the current value of this property for BACnet operations
   * 
   * This internal method is used by BACnet objects to read the property value
   * when handling BACnet protocol operations.
   * 
   * @returns The current property value in BACnet format
   * @internal
   */
  ___readValue(): BACNetAppData<Tag, Type> {
    return typeof this.#value === 'function' ? this.#value() : this.#value;
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
  async ___writeValue(value: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[]): Promise<void> { 
    if (!this.writable || !this.settable) { 
      throw new BDError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (Array.isArray(value)) { 
      if (value.length !== 1) {
        throw new BDError('not a list', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
      } else { 
        value = value[0];
      }
    }
    if (value.type !== this.type) { 
      throw new BDError('not a list', ErrorCode.REJECT_INVALID_PARAMETER_DATA_TYPE, ErrorClass.PROPERTY);
    }
    await this.#queue.push(value);
  }
  
  /**
   * Worker function for processing the value change queue
   * 
   * This method processes each value change and triggers the appropriate events.
   * 
   * @param value - The new value to set
   * @private
   */
  #worker = async (value: BACNetAppData<Tag, Type>) => { 
    await this.trigger('beforecov', this, value);
    this.#value = value;
    await this.trigger('aftercov', this, value);
  };
 
}