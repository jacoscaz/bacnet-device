
// The following are simplified versions of the equivalent typings for
// Node.js's native EventEmitter, as taken from the `@types/node` package.

/** 
 * @private 
 */
export type EventMap<T> = Record<keyof T, any[]>;

/** 
 * @private 
 */
export type Key<T> = keyof T;

/** 
 * @private 
 */
export type Args<T, K extends Key<T>> = T[K];

/** 
 * @private 
 */
export type Listener<T, K extends Key<T>> = T[K] extends unknown[] ? (...args: T[K]) => Promise<void> : never;


/**
 * Implements an event emitter, conceptually similar to Node.js' native
 * EventEmitter, that supports asynchronous event handlers/listeners.
 * 
 * @private
 */
export class Evented<T extends EventMap<T>> { 
  
  #callbacks: { [K in Key<T>]: Listener<T, K>[] };
  
  constructor() { 
    this.#callbacks = Object.create(null);
  }
  
  /**
   * Adds a new listener for the specified event.
   */
  subscribe<K extends Key<T>>(event: K, cb: Listener<T, K>) { 
    if (!this.#callbacks[event]) {
      this.#callbacks[event] = [];
    }
    this.#callbacks[event].push(cb);
  }
  
  /**
   * Fires an event. All subscribed listeners will be called in parallel.
   */
  async trigger<K extends Key<T>>(event: K, ...args: Args<T, K>) {
    if (this.#callbacks[event]) { 
      // TODO: consider whether to call listeners in series.
      await Promise.all(this.#callbacks[event].map(cb => cb.apply(this, args)));  
    }
  }
  
}
