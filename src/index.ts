
/**
 * BACnet Device Library
 * 
 * A TypeScript library for implementing BACnet IP devices in Node.js.
 * This module provides all the necessary types and classes for creating
 * and managing BACnet devices, objects, and properties.
 * 
 * @packageDocumentation
 */

export { BDError } from './errors.js';

export { TaskQueue } from './taskqueue.js';

export { 
  type EventMap,
  type EventKey,
  type EventArgs,
  type EventListener,
  AsyncEventEmitter, 
} from './events.js';

export {
  type BDPropertyEvents,
  type BDPropertyValueGetter,
  type BDPropertyAccessContext,
  BDPropertyType,
  BDAbstractProperty,
  BDArrayProperty, 
  BDSingletProperty,
} from './properties/index.js';

export { 
  type BDObjectEvents,
  BDObject,
} from './objects/generic/object.js';

export { BDDevice } from './objects/device/device.js';

export { 
  type BDDeviceOpts, 
  type BDSubscription,
  type BDDeviceEvents,
} from './objects/device/types.js';

export * from './objects/analogoutput.js';
export * from './objects/analoginput.js';
export * from './objects/analogvalue.js';

export * from './objects/integervalue.js';
export * from './objects/positiveintegervalue.js';
