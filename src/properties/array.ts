
/**
 * BACnet array property implementation module
 * 
 * This module provides the implementation for BACnet properties
 * that contain multiple values in an array.
 * 
 * @module
 */

import fastq from 'fastq';

import { AsyncEventEmitter, type EventMap } from '../events.js';
import { BACNetError } from '../errors.js';
import { property as debug } from '../debug.js';
import { 
  type BACNetAppData,
  type ApplicationTagValueTypeMap,
  PropertyIdentifier, 
  ErrorCode, 
  ErrorClass, 
  ApplicationTag,
} from '@innovation-system/node-bacnet';
import { throwNotWritable } from './utils.js';

/**
 * Events that can be emitted by a BACnet array property
 * 
 * This interface defines the events that can be triggered by BACnet array properties
 * when their values change.
 * 
 * @typeParam Tag - The BACnet application tag for the property values
 * @typeParam Type - The JavaScript type corresponding to the application tag
 */
export interface BDArrayPropertyEvents<Tag extends ApplicationTag, Type extends ApplicationTagValueTypeMap[Tag]> extends EventMap {   
  /** Emitted before a property value changes */
  beforecov: [property: BDArrayProperty<Tag, Type>, raw: BACNetAppData<Tag, Type>[]],
  /** Emitted after a property value has changed */
  aftercov: [property: BDArrayProperty<Tag, Type>, raw: BACNetAppData<Tag, Type>[]],
}

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
export class BDArrayProperty<Tag extends ApplicationTag, Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]> extends AsyncEventEmitter<BDArrayPropertyEvents<Tag, Type>> {
  
  /** Indicates this is not a list/array property (BACnet semantic, not JavaScript array) */
  readonly list: true;
  
  /** Whether this property can be written to */
  readonly writable: boolean;
  
  /** The BACnet property identifier */
  readonly identifier: PropertyIdentifier;
  
  /** 
   * The current values of this property 
   * @private
   */
  #value: BACNetAppData<Tag, Type>[] | (() => BACNetAppData<Tag, Type>[]);
  
  /**
   * Queue for serializing value changes
   * @private
   */
  #queue: fastq.queueAsPromised<BACNetAppData<Tag, Type>[]>;
  
  /**
   * Creates a new BACnet array property
   * 
   * @param identifier - The BACnet property identifier
   * @param writable - Whether this property can be written to
   * @param value - Optional initial values for this property. If provided, the property is not settable as a whole.
   */
  constructor(identifier: PropertyIdentifier, writable: boolean, value: BACNetAppData<Tag, Type>[] | (() => BACNetAppData<Tag, Type>[])) {
    super();
    this.list = true;
    this.identifier = identifier;
    this.#value = value;
    this.writable = typeof value === 'function' ? false : writable;
    this.#queue = fastq.promise(this.#worker, 1)
  }
  
  /**
   * Gets the current values of this property
   * 
   * @returns An array of the current property values
   */
  get value(): BACNetAppData<Tag, Type>[] {
    return typeof this.#value === 'function' ? this.#value() : this.#value;
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
  async set(value: BACNetAppData<Tag, Type>[]): Promise<void> {
    await this.#queue.push(value);
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
  ___readValue(): BACNetAppData<Tag, Type>[] {
    return this.value;
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
  async ___writeValue(value: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[]): Promise<void> { 
    if (!this.writable) { 
      throw new BACNetError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (!Array.isArray(value)) { 
      value = [value];
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
  #worker = async (value: BACNetAppData<Tag, Type>[]) => {
    if (typeof this.#value === 'function') {
      throw new BACNetError('polled property', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    await this.___asyncEmitSeries(true, 'beforecov', this, value);
    this.#value = value;
    await this.___asyncEmitSeries(false, 'aftercov', this, value);
  };
 
}
