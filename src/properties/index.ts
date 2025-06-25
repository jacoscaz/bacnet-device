
/**
 * BACnet property implementations module
 * 
 * This module provides the core property implementations for BACnet objects.
 * Properties are the data elements that make up BACnet objects, and this module
 * defines the base types and interfaces for them.
 * 
 * @module
 */

export { 
  type BDPropertyEvents, 
  type BDPropertyAccessContext,
  type BDPropertyDataGetter as BDPropertyValueGetter,
  BDPropertyType,
  BDAbstractProperty,
} from './abstract.js';

export {  BDSingletProperty } from './singlet.js';

export {  BDArrayProperty } from './array.js';
