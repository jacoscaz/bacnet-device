
import { events as debug } from './debug.js';
/**
 * Event handling module for BACnet devices
 * 
 * This module provides an asynchronous event system for BACnet components.
 * The implementation is inspired by Node.js's native EventEmitter but supports
 * asynchronous event handlers.
 * 
 * @module
 */

// The following are simplified versions of the equivalent typings for
// Node.js's native EventEmitter, as taken from the `@types/node` package.

/** 
 * Type mapping for event names to their argument arrays
 * 
 * @typeParam T - An interface mapping event names to their argument arrays
 * @private 
 */
export type EventMap<T> = Record<keyof T, any[]>;

/** 
 * Extracts the argument types for a specific event
 * 
 * @typeParam T - An event map interface
 * @typeParam K - The event name to extract arguments for
 * @private 
 */
export type EventArgs<T, K extends keyof T> = T[K];

/** 
 * Type for event listeners/handlers
 * 
 * @typeParam T - An event map interface
 * @typeParam K - The event name this listener handles
 * @private 
 */
export type EventListener<T, K extends keyof T> = T[K] extends unknown[] ? (...args: T[K]) => Promise<any> | any : never;


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
export class AsyncEventEmitter<T extends EventMap<T>> { 
  
  /** 
   * Internal mapping of event names to their registered listeners
   * @private 
   */
  #callbacks: { [K in keyof T]: EventListener<T, K>[] };
  
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
  on<K extends keyof T>(event: K, cb: EventListener<T, K>) { 
    if (!this.#callbacks[event]) {
      this.#callbacks[event] = [];
    }
    this.#callbacks[event].push(cb);
  }
  
  /**
   * Alias for `on`
   * @alias on
   */
  addListener<K extends keyof T>(event: K, cb: EventListener<T, K>) {
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
  ___emit<K extends keyof T>(event: K, ...args: EventArgs<T, K>) {
    if (event in this.#callbacks) { 
      const callbacks = this.#callbacks[event];
      for (let i = 0; i < callbacks.length; i += 1) { 
        callbacks[i].apply(this, args);
      }
    }
  }
  
  /**
   * Fires an event. All subscribed listeners will be called in series.
   * Promises will be awaited for before continuing to the next listener.
   * 
   * @param event - The event name to trigger
   * @param args - The arguments to pass to each listener
   * @returns A promise that resolves when all listeners have completed
   * @internal
   */
  async ___asyncEmitSeries<K extends keyof T>(throwErrors: boolean, event: K, ...args: EventArgs<T, K>) {
    if (event in this.#callbacks) {
      const callbacks = this.#callbacks[event];
      for (let i = 0; i < callbacks.length; i += 1) {
        try {
          await callbacks[i].apply(this, args);
        } catch (err) {
          debug('error while calling listener #%s for event %s: %s', i, event, err instanceof Error ? err.stack : String(err));
          if (throwErrors) { 
            throw err;
          } 
        }
      }
    }
  }
  
}
