
/**
 * BACnet object implementation module
 * 
 * This module provides the base implementation for BACnet objects,
 * which are the core components of BACnet devices.
 * 
 * @module
 */

import { Evented, type EventMap } from './evented.js';

import { type BACnetValue } from './value.js';
import { BACnetError } from './errors.js';

import {
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from './enums/index.js';

import type {
  BACNetObjectID,
  BACNetPropertyID,
  BACNetReadAccess,
} from '@innovation-system/node-bacnet';

import type { 
  ReadPropertyContent,
  ReadPropertyMultipleContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import {
  BACnetSingletProperty,
  BACnetArrayProperty,
  type BACnetProperty,
} from './properties/index.js';
import { ensureArray } from './utils.js';

/**
 * Events that can be emitted by a BACnet object
 */
export interface BACnetObjectEvents extends EventMap<any> { 
  /** Emitted before a property value changes */
  beforecov: [object: BACnetObject, property: BACnetProperty<any, any>, nextValue: BACnetValue | BACnetValue[]],
  
  /** Emitted after a property value has changed */
  aftercov: [object: BACnetObject, property: BACnetProperty<any, any>, newValue: BACnetValue | BACnetValue[]],
}

/**
 * According to the BACnet specification, certain properties should not
 * be included in the Property_List property of objects.
 * 
 * @see section 12.1.1.4.1 "Property_List"
 */
const unlistedProperties: PropertyIdentifier[] = [
  PropertyIdentifier.OBJECT_NAME,
  PropertyIdentifier.OBJECT_TYPE,
  PropertyIdentifier.OBJECT_IDENTIFIER,
  PropertyIdentifier.PROPERTY_LIST,
];

/**
 * Base class for all BACnet objects
 * 
 * This class implements the core functionality required by all BACnet objects
 * according to the BACnet specification. It manages object properties and
 * handles property read/write operations and CoV notifications.
 * 
 * @extends Evented<BACnetObjectEvents>
 */
export class BACnetObject<EM extends BACnetObjectEvents = BACnetObjectEvents> extends Evented<EM> { 
  
  /** The unique identifier for this object (type and instance number) */
  readonly identifier: BACNetObjectID;
  
  /** 
   * The list of properties in this object (used for PROPERTY_LIST property)
   * @private
   */
  readonly #propertyList: BACnetValue<ApplicationTag.ENUMERATED, PropertyIdentifier>[];
  
  /**
   * Map of all properties in this object by their identifier
   * @private
   */
  readonly #properties: Map<PropertyIdentifier, BACnetProperty<any, any>>;
  
  /**
   * Creates a new BACnet object
   * 
   * @param type - The BACnet object type
   * @param instance - The instance number for this object
   * @param name - The name of this object
   */
  constructor(type: ObjectType, instance: number, name: string) {
    super();
    this.identifier = Object.freeze({ type, instance });
    this.#properties = new Map();
    this.#propertyList = [];
    
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.OBJECT_NAME, ApplicationTag.CHARACTER_STRING, false, name));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.OBJECT_TYPE, ApplicationTag.ENUMERATED, false, type));
    this.addProperty(new BACnetSingletProperty(PropertyIdentifier.OBJECT_IDENTIFIER, ApplicationTag.OBJECTIDENTIFIER, false, this.identifier));
    this.addProperty(new BACnetArrayProperty(PropertyIdentifier.PROPERTY_LIST, ApplicationTag.ENUMERATED, false, this.#propertyList));
  }
  
  /**
   * Adds a property to this object
   * 
   * This method registers a new property with the object and sets up
   * event subscriptions for property value changes.
   * 
   * @param property - The property to add
   * @returns The added property
   * @throws Error if a property with the same identifier already exists
   * @typeParam T - The specific BACnet property type
   */
  addProperty<T extends BACnetProperty<any, any>>(property: T): T { 
    if (this.#properties.has(property.identifier)) { 
      throw new Error('Cannot register property: duplicate property identifier');
    }
    this.#properties.set(property.identifier, property);
    if (!unlistedProperties.includes(property.identifier)) { 
      this.#propertyList.push({ type: ApplicationTag.ENUMERATED, value: property.identifier });
    }
    property.subscribe('beforecov', this.#onPropertyBeforeCov);
    property.subscribe('aftercov', this.#onPropertyAfterCov);
    return property;
  }

  /**
   * Writes a value to a property
   * 
   * This internal method is used to handle write operations from the BACnet network.
   * 
   * @param identifier - The identifier of the property to write
   * @param value - The value to write to the property
   * @throws BACnetError if the property does not exist
   * @internal
   */
  async ___writeProperty(identifier: BACNetPropertyID, value: BACnetValue | BACnetValue[]): Promise<void> {
    const property = this.#properties.get(identifier.id as PropertyIdentifier);
    // TODO: test/validate value before setting it!
    if (property) {
      await property.___writeValue(value);
    } else { 
      throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);    
    }
  }
  
  /**
   * Reads a value from a property
   * 
   * This internal method is used to handle read operations from the BACnet network.
   * 
   * @param req - The read property request
   * @returns The property value
   * @throws BACnetError if the property does not exist
   * @internal
   */
  async ___readProperty(req: ReadPropertyContent): Promise<BACnetValue | BACnetValue[]> {
    const { payload: { property } } = req;
    if (this.#properties.has(property.id as PropertyIdentifier)) { 
      return this.#properties.get(property.id as PropertyIdentifier)!
        .___readValue();
    }
    throw new BACnetError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);
  }
  
  /**
   * Reads all properties from this object
   * 
   * This internal method is used to handle ReadPropertyMultiple operations
   * when the ALL property identifier is used.
   * 
   * @returns An object containing all property values
   * @internal
   */
  async ___readPropertyMultipleAll(): Promise<BACNetReadAccess> { 
    const values: BACNetReadAccess['values'] = [];
    for (const [identifier, property] of this.#properties.entries()) {
      values.push({ property: { id: identifier, index: 0 }, value: ensureArray(property.___readValue()) });
    }
    return { objectId: this.identifier, values };
  }
  
  /**
   * Reads multiple properties from this object
   * 
   * This internal method is used to handle ReadPropertyMultiple operations
   * from the BACnet network.
   * 
   * @param properties - Array of property identifiers to read
   * @returns An object containing the requested property values
   * @internal
   */
  async ___readPropertyMultiple(properties: ReadPropertyMultipleContent['payload']['properties'][number]['properties']): Promise<BACNetReadAccess> { 
    const values: BACNetReadAccess['values'] = [];
    if (properties.length === 1 && properties[0].id === PropertyIdentifier.ALL) { 
      return this.___readPropertyMultipleAll();
    }
    for (const property of properties) {
      if (this.#properties.has(property.id)) {
        values.push({ property, value: ensureArray(this.#properties.get(property.id)!.___readValue()) });
      }
    }
    return { objectId: this.identifier, values };
  }
  
  /**
   * Handler for property 'beforecov' events
   * 
   * This method is called before a property value changes and propagates
   * the event to object subscribers.
   * 
   * @param property - The property that is changing
   * @param nextValue - The new value being set
   * @private
   */
  #onPropertyBeforeCov = async (property: BACnetProperty<any, any>, nextValue: BACnetValue | BACnetValue[]) => { 
    await this.trigger('beforecov', this, property, nextValue);
  };
  
  /**
   * Handler for property 'aftercov' events
   * 
   * This method is called after a property value changes and propagates
   * the event to object subscribers.
   * 
   * @param property - The property that changed
   * @param nextValue - The new value that was set
   * @private
   */
  #onPropertyAfterCov = async (property: BACnetProperty<any, any>, nextValue: BACnetValue | BACnetValue[]) => { 
    await this.trigger('aftercov', this, property, nextValue);
  };
    
}