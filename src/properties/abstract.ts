
import { 
  type BACNetAppData,
  type ApplicationTag,
  type PropertyIdentifier,
  type ApplicationTagValueTypeMap,
  ErrorCode,
  ErrorClass,
} from '@innovation-system/node-bacnet';

import { BDError } from '../errors.js';

import { 
  type EventMap,
  AsyncEventEmitter,
} from '../events.js';
import { TaskQueue } from '../taskqueue.js';

/**
 * Maps the names of property events to the respective arrays of arguments.
 * Used to strongly type calls to `AsyncEventEmitter.prototype.on()`.
 * 
 * @see {@link AsyncEventEmitter}
 */
export interface BDPropertyEvents<
  Tag extends ApplicationTag, 
  Type extends ApplicationTagValueTypeMap[Tag], 
  Data extends BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[],
> extends EventMap {   
  /** 
   * Emitted before a property value changes. Listeners can throw in order to
   * block the change from going through (useful for additional validation).
   */
  beforecov: [property: BDAbstractProperty<Tag, Type, Data>, raw: Data],
  /** 
   * Emitted after a property value has changed. Errors throws by listeners 
   * will be ignored. 
   */
  aftercov: [property: BDAbstractProperty<Tag, Type, Data>, raw: Data],
}

/**
 * Enumerates the types of properties that can be defined.
 */
export enum BDPropertyType {
  /** A property whose data consists of a single value. */
  SINGLET = 0,
  /** A property whose data consists of an array of values. */
  ARRAY = 1,
}

const shared_task_queue = new TaskQueue();

/**
 * Dictionary of items available while accessing a property's data,
 * usually via a `context` or `ctx` argument.
 */
export interface BDPropertyAccessContext {
  /** The date and time at which the property is being accessed. */
  date: Date;
}

/**
 * Describes a function that may be set as a property's data instead of a
 * static value.
 */
export type BDPropertyDataGetter<Data extends BACNetAppData | BACNetAppData[]> = 
  (ctx: BDPropertyAccessContext) => Data;

/**
 * Abstract base class for all types of properties.
 */
export abstract class BDAbstractProperty<
  Tag extends ApplicationTag, 
  Type extends ApplicationTagValueTypeMap[Tag], 
  Data extends BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[],
> extends AsyncEventEmitter<BDPropertyEvents<Tag, Type, Data>> { 
  
  /**
   * @see {@link BDPropertyType}
   */
  abstract readonly type: BDPropertyType;
  
  /**
   * This property's BACnet identifier.
   */
  readonly identifier: PropertyIdentifier;
  
  /**
   * Indicates whether this property can be written to by other devices in
   * the BACnet network.
   */
  readonly writable: boolean;
  
  #queue: TaskQueue;
  
  #data: Data | BDPropertyDataGetter<Data>;
  
  constructor(identifier: PropertyIdentifier, writable: boolean, data: Data | BDPropertyDataGetter<Data>) {
    super();
    this.#data = data;
    this.identifier = identifier;
    this.writable = typeof data !== 'function' && writable;
    this.#queue = shared_task_queue;
  }
  
  getData(): Data {
    return typeof this.#data === 'function' ? this.#data({ date: new Date() }) : this.#data;
  }
  
  async setData(data: Data): Promise<void> {
    await this.#queue.run(() => this.___updateData(data));
  }
  
  abstract ___readData(index: number, ctx: BDPropertyAccessContext): BACNetAppData | BACNetAppData[];
  
  abstract ___writeData(value: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[]): Promise<void>;
  
  /**
   * Allows the object to which this property is added to share its own task
   * queue, so that calls to `setData` may be managed transactionally
   * with requests to access the property's data coming from the BACnet
   * network.
   * @see {@link setData}
   * @internal
   */
  ___setQueue(queue: TaskQueue) {
    this.#queue = queue;
  }
  
  /**
   * Used by subclasses to update this property's data.
   * @see {@link ___readData}
   * @see {@link ___writeData}
   * @internal
   */
  protected async ___updateData(data: Data): Promise<void> {
    if (typeof this.#data === 'function') {
      throw new BDError('polled property', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    await this.___asyncEmitSeries(true, 'beforecov', this, data);
    this.#data = data;
    await this.___asyncEmitSeries(false, 'aftercov', this, data);
  }
  
} 