
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

const shared_task_queue = new TaskQueue();

export interface BDPropertyAccessContext {
  date: Date;
}

export type BDPropertyValueGetter<Data extends BACNetAppData | BACNetAppData[]> = 
  (ctx: BDPropertyAccessContext) => Data;

export abstract class BDAbstractProperty<
  Tag extends ApplicationTag, 
  Type extends ApplicationTagValueTypeMap[Tag], 
  Data extends BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[],
> extends AsyncEventEmitter<BDPropertyEvents<Tag, Type, Data>> { 
  
  abstract readonly type: BDPropertyType;
  
  readonly identifier: PropertyIdentifier;
  
  readonly writable: boolean;
  
  #queue: TaskQueue;
  
  #data: Data | BDPropertyValueGetter<Data>;
  
  constructor(identifier: PropertyIdentifier, writable: boolean, value: Data | BDPropertyValueGetter<Data>) {
    super();
    this.#data = value;
    this.identifier = identifier;
    this.writable = typeof value !== 'function' && writable;
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
  
  ___setQueue(queue: TaskQueue) {
    this.#queue = queue;
  }
  
  protected async ___updateData(data: Data): Promise<void> {
    if (typeof this.#data === 'function') {
      throw new BDError('polled property', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    await this.___asyncEmitSeries(true, 'beforecov', this, data);
    this.#data = data;
    await this.___asyncEmitSeries(false, 'aftercov', this, data);
  }
  
} 