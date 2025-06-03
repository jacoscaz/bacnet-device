
type EventMap<T> = Record<keyof T, any[]>;

type Key<T> = keyof T;

type Args<T, K extends Key<T>> = T[K];

type Listener<T, K extends Key<T>> = T[K] extends unknown[] ? (...args: T[K]) => Promise<void> : never;

/**
 * Implements an event emitter that supports asynchronous event listeners.
 * @private
 */
export class Evented<T extends EventMap<T>> { 
  
  #callbacks: { [K in Key<T>]: Listener<T, K>[] };
  
  constructor() { 
    this.#callbacks = Object.create(null);
  }
  
  subscribe<K extends Key<T>>(event: K, cb: Listener<T, K>) { 
    if (!this.#callbacks[event]) {
      this.#callbacks[event] = [];
    }
    this.#callbacks[event].push(cb);
  }
  
  async trigger<K extends Key<T>>(event: K, ...args: Args<T, K>) {
    await Promise.all(this.#callbacks[event]?.map(cb => cb.apply(this, args)));
  }
  
}
