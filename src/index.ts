
/**
 * BACnet Device Library
 * 
 * A TypeScript library for implementing BACnet IP devices in Node.js.
 * This module provides all the necessary types and classes for creating
 * and managing BACnet devices, objects, and properties.
 * 
 * @packageDocumentation
 */

/**
 * Re-export of the {@link BACnetValue} type that represents values in BACnet properties
 */
export type { BACnetValue, BACnetTimestamp } from './value.js';

/**
 * Re-export of the {@link BACnetError} type for handling BACnet-specific errors
 */
export type { BACnetError } from './errors.js';

/**
 * Re-export of the {@link BACnetProperty} interface for BACnet property implementations
 */
export type { BACnetProperty } from './properties/index.js';

/**
 * Re-export of the {@link BACnetDeviceOpts} interface for BACnet device implementations
 */
export type { BACnetDeviceOpts } from './objects/device/types.js';

/**
 * Export all BACnet enumeration values
 */
export * from './enums/index.js';

/**
 * Export all BitString classes
 */
export * from './bitstrings/index.js';

/**
 * Export {@link BACnetObject} class for BACnet object implementation
 */
export { BACnetObject } from './object.js';

/**
 * Export BACnet property implementations:
 * - {@link BACnetArrayProperty} for array-type properties
 * - {@link BACnetSingletProperty} for single-value properties
 */
export { BACnetArrayProperty, BACnetSingletProperty } from './properties/index.js';

/**
 * Export BACnet object implementations:
 * - {@link BACnetDevice} for device objects
 * - {@link BACnetAnalogOutput} for analog output objects
 * - {@link BACnetAnalogInput} for analog input objects
 */
export { BACnetDevice } from './objects/device/device.js';
export { BACnetAnalogOutput } from './objects/analogoutput.js';
export { BACnetAnalogInput } from './objects/analoginput.js';
