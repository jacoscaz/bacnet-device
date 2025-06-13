
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
export type BDEventMap<T> = Record<keyof T, any[]>;

/** 
 * Extracts the argument types for a specific event
 * 
 * @typeParam T - An event map interface
 * @typeParam K - The event name to extract arguments for
 * @private 
 */
export type BDEventArgs<T, K extends keyof T> = T[K];

/** 
 * Type for event listeners/handlers
 * 
 * @typeParam T - An event map interface
 * @typeParam K - The event name this listener handles
 * @private 
 */
export type BDEventListener<T, K extends keyof T> = T[K] extends unknown[] ? (...args: T[K]) => Promise<void> : never;


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
export class BDEvented<T extends BDEventMap<T>> { 
  
  /** 
   * Internal mapping of event names to their registered listeners
   * @private 
   */
  #callbacks: { [K in keyof T]: BDEventListener<T, K>[] };
  
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
  subscribe<K extends keyof T>(event: K, cb: BDEventListener<T, K>) { 
    if (!this.#callbacks[event]) {
      this.#callbacks[event] = [];
    }
    this.#callbacks[event].push(cb);
  }
  
  /**
   * Fires an event. All subscribed listeners will be called in parallel.
   * 
   * @param event - The event name to trigger
   * @param args - The arguments to pass to each listener
   * @returns A promise that resolves when all listeners have completed
   */
  async trigger<K extends keyof T>(event: K, ...args: BDEventArgs<T, K>) {
    if (this.#callbacks[event]) { 
      // TODO: consider whether to call listeners in series.
      await Promise.all(this.#callbacks[event].map(cb => cb.apply(this, args)));  
    }
  }
  
}
