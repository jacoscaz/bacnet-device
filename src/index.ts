
/**
 * BACnet Device Library
 * 
 * A TypeScript library for implementing BACnet IP devices in Node.js.
 * This module provides all the necessary types and classes for creating
 * and managing BACnet devices, objects, and properties.
 * 
 * @packageDocumentation
 */

export { BACNetError as BDError } from './errors.js';

export { 
  type EventMap,
  type EventArgs, 
  type EventListener,
  AsyncEventEmitter, 
} from './events.js';

export { 
  type BDProperty,
  type BDArrayPropertyEvents,
  type BDSingletPropertyEvents,
  BDArrayProperty, 
  BDSingletProperty,
} from './properties/index.js';

export { type BDObjectEvents, BDObject } from './object.js';

export { BDDevice } from './objects/device/device.js';

export { 
  type BDDeviceOpts, 
  type BDSubscription,
  type BDDeviceEvents,
} from './objects/device/types.js';

export { type BDAnalogOutputOpts, BDAnalogOutput } from './objects/analogoutput.js';
export { type BDAnalogInputOpts, BDAnalogInput } from './objects/analoginput.js';
