
import { events as debug } from './debug.js';

export type EventMap = Record<string, any[]>;

export type EventKey<T extends EventMap> = keyof T;

export type EventArgs<T extends EventMap, K extends EventKey<T>> = K extends keyof T 
  ? T[K] 
  : never;

export type EventListener<T extends EventMap, K extends EventKey<T>> = T[K] extends unknown[] 
  ? (...args: T[K]) => any 
  : never;

/**
 * Implements an event emitter, conceptually similar to Node.js' native
 * EventEmitter, that supports asynchronous event handlers/listeners.
 * 
 * This class provides a foundation for event-based communication between
 * BACnet components. It allows objects to register listeners for specific events
 * and trigger those events asynchronously.
 * 
 * @typeParam T - An interface mapping event names to their argument arrays
 */
export class AsyncEventEmitter<T extends EventMap> { 
  
  /** 
   * Internal mapping of event names to their registered listeners
   * @private 
   */
  #callbacks: { [K in EventKey<T>]: EventListener<T, K>[] };
  
  /**
   * Creates a new Evented instance with no registered listeners
   */
  constructor() { 
    this.#callbacks = Object.create(null);
  }
  
  /**
   * Adds a new listener for the specified event.
   * 
   * @param event - The event name to subscribe to
   * @param cb - The callback function to execute when the event is triggered
   * @returns The callback function for chaining
   */
  on<K extends EventKey<T>>(event: K, cb: EventListener<T, K>) { 
    let callbacks = this.#callbacks[event];
    if (!callbacks) { 
      callbacks = (this.#callbacks[event] = []);
    }
    callbacks.push(cb);
  }
  
  /**
   * Alias for `on`
   */
  addListener<K extends EventKey<T>>(event: K, cb: EventListener<T, K>) {
    this.on(event, cb);
  }
  
  /**
   * Fires an event. All subscribed listeners will be called synchronously.
   * Promises will be ignored.
   * 
   * @param event - The event name to trigger
   * @param args - The arguments to pass to each listener
   * @internal
   */
  ___emit<K extends EventKey<T>>(event: K, ...args: EventArgs<T, K>) {
    const callbacks = this.#callbacks[event];
    if (callbacks) { 
      for (let i = 0; i < callbacks.length; i += 1) { 
        callbacks[i].apply(this, args);
      }
    }
  }
  
  /**
   * Fires an event. All subscribed listeners will be called in series.
   * Promises will be awaited for before continuing to the next listener.
   * 
   * @param rethrow - Whether to rethrow errors thrown by listeners or ignore them
   * @param event - The event name to trigger
   * @param args - The arguments to pass to each listener
   * @returns A promise that resolves when all listeners have completed
   * @internal
   */
  async ___asyncEmitSeries<K extends EventKey<T>>(rethrow: boolean, event: K, ...args: EventArgs<T, K>) {
    const callbacks = this.#callbacks[event];
    if (callbacks) {
      for (let i = 0; i < callbacks.length; i += 1) {
        try {
          await callbacks[i].apply(this, args);
        } catch (err) { 
          debug('error while calling listener #%s for event %s: %s', i, event, err instanceof Error ? err.stack : String(err));
          if (rethrow) {
            throw err;
          }
        }
      }
    }
  }
  
}
