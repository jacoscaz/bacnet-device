
import fastq from 'fastq';

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

export interface BDPropertyEvents<
  Tag extends ApplicationTag, 
  Type extends ApplicationTagValueTypeMap[Tag], 
  Data extends BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[],
> extends EventMap {   
  /** Emitted before a property value changes */
  beforecov: [property: BDAbstractProperty<Tag, Type, Data>, raw: Data],
  /** Emitted after a property value has changed */
  aftercov: [property: BDAbstractProperty<Tag, Type, Data>, raw: Data],
}

export enum BDPropertyType {
  SINGLET = 0,
  ARRAY = 1,
}

export abstract class BDAbstractProperty<
  Tag extends ApplicationTag, 
  Type extends ApplicationTagValueTypeMap[Tag], 
  Data extends BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[],
> extends AsyncEventEmitter<BDPropertyEvents<Tag, Type, Data>> { 
  
  abstract readonly type: BDPropertyType;
  
  readonly identifier: PropertyIdentifier;
  
  readonly writable: boolean;
  
  #data: Data | (() => Data);
  
  #queue: fastq.queueAsPromised<Data>;
  
  constructor(identifier: PropertyIdentifier, writable: boolean, value: Data | (() => Data)) {
    super();
    this.#data = value;
    this.identifier = identifier;
    this.writable = typeof value !== 'function' && writable;
    this.#queue = fastq.promise(this.#worker, 1);
  }
  
  getData(): Data {
    return typeof this.#data === 'function' ? this.#data() : this.#data;
  }
  
  async setData(value: Data): Promise<void> {
    await this.#queue.push(value);
  }
  
  abstract ___readData(index: number): BACNetAppData | BACNetAppData[];
  
  abstract ___writeData(value: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[]): Promise<void>;
  
  async ___queueData(value: Data): Promise<void> {
    await this.#queue.push(value);
  }
  
  /**
   * Worker function for processing the value change queue
   * 
   * This method processes each value change and triggers the appropriate events.
   * 
   * @param data - The new value to set
   * @private
   */
  #worker = async (data: Data) => {
    if (typeof this.#data === 'function') {
      throw new BDError('polled property', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    await this.___asyncEmitSeries(true, 'beforecov', this, data);
    this.#data = data;
    await this.___asyncEmitSeries(false, 'aftercov', this, data);
  };
  
  
} 