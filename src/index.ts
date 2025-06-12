
/**
 * BACnet Device Library
 * 
 * A TypeScript library for implementing BACnet IP devices in Node.js.
 * This module provides all the necessary types and classes for creating
 * and managing BACnet devices, objects, and properties.
 * 
 * @packageDocumentation
 */

export type { BDValue, BDTimestamp } from './value.js';

export { BDError } from './errors.js';

export * from './enums/index.js';

export * from './bitstrings/index.js';

export { 
  type BDProperty,
  BDArrayProperty, 
  BDSingletProperty,
} from './properties/index.js';

export { BDObject } from './object.js';

export { BDDevice } from './objects/device/device.js';
export { type BDDeviceOpts } from './objects/device/types.js';

export { BDAnalogOutput } from './objects/analogoutput.js';
export { BDAnalogInput } from './objects/analoginput.js';
