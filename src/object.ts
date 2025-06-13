
/**
 * BACnet object implementation module
 * 
 * This module provides the base implementation for BACnet objects,
 * which are the core components of BACnet devices.
 * 
 * @module
 */

import { BDEvented, type BDEventMap } from './evented.js';

import { type BDValue } from './value.js';
import { BDError } from './errors.js';

import {
  BDErrorCode,
  BDErrorClass,
  BDObjectType,
  BDApplicationTag,
  BDPropertyIdentifier,
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
  BDSingletProperty,
  BDArrayProperty,
  type BDProperty,
} from './properties/index.js';
import { ensureArray } from './utils.js';

/**
 * Events that can be emitted by a BACnet object
 */
export interface BDObjectEvents extends BDEventMap<any> { 
  /** Emitted before a property value changes */
  beforecov: [object: BDObject, property: BDProperty<any, any>, nextValue: BDValue | BDValue[]],
  
  /** Emitted after a property value has changed */
  aftercov: [object: BDObject, property: BDProperty<any, any>, newValue: BDValue | BDValue[]],
}

/**
 * According to the BACnet specification, certain properties should not
 * be included in the Property_List property of objects.
 * 
 * @see section 12.1.1.4.1 "Property_List"
 */
const unlistedProperties: BDPropertyIdentifier[] = [
  BDPropertyIdentifier.OBJECT_NAME,
  BDPropertyIdentifier.OBJECT_TYPE,
  BDPropertyIdentifier.OBJECT_IDENTIFIER,
  BDPropertyIdentifier.PROPERTY_LIST,
];

/**
 * Base class for all BACnet objects
 * 
 * This class implements the core functionality required by all BACnet objects
 * according to the BACnet specification. It manages object properties and
 * handles property read/write operations and CoV notifications.
 * 
 * @extends BDEvented<BDObjectEvents>
 */
export class BDObject<EM extends BDObjectEvents = BDObjectEvents> extends BDEvented<EM> { 
  
  /** The unique identifier for this object (type and instance number) */
  readonly identifier: BACNetObjectID;
  
  /** 
   * The list of properties in this object (used for PROPERTY_LIST property)
   * @private
   */
  readonly #propertyList: BDValue<BDApplicationTag.ENUMERATED, BDPropertyIdentifier>[];
  
  /**
   * Map of all properties in this object by their identifier
   * @private
   */
  readonly #properties: Map<BDPropertyIdentifier, BDProperty<any, any>>;
  
  /**
   * Creates a new BACnet object
   * 
   * @param type - The BACnet object type
   * @param instance - The instance number for this object
   * @param name - The name of this object
   */
  constructor(type: BDObjectType, instance: number, name: string, description: string = '') {
    super();
    this.identifier = Object.freeze({ type, instance });
    this.#properties = new Map();
    this.#propertyList = [];
    
    this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.OBJECT_NAME, 
      BDApplicationTag.CHARACTER_STRING, 
      false, 
      name,
    ));
    
    this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.OBJECT_TYPE, 
      BDApplicationTag.ENUMERATED, 
      false, 
      type,
    ));
    
    this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.OBJECT_IDENTIFIER, 
      BDApplicationTag.OBJECTIDENTIFIER, 
      false, 
      this.identifier,
    ));
    
    this.addProperty(new BDArrayProperty(
      BDPropertyIdentifier.PROPERTY_LIST, 
      BDApplicationTag.ENUMERATED, 
      false, 
      () => this.#propertyList,
    ));
    
    this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.DESCRIPTION, 
      BDApplicationTag.CHARACTER_STRING, 
      false, 
      description,
    ));
    
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
  addProperty<T extends BDProperty<any, any>>(property: T): T { 
    if (this.#properties.has(property.identifier)) { 
      throw new Error('Cannot register property: duplicate property identifier');
    }
    this.#properties.set(property.identifier, property);
    if (!unlistedProperties.includes(property.identifier)) { 
      this.#propertyList.push({ type: BDApplicationTag.ENUMERATED, value: property.identifier });
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
  async ___writeProperty(identifier: BACNetPropertyID, value: BDValue | BDValue[]): Promise<void> {
    const property = this.#properties.get(identifier.id as BDPropertyIdentifier);
    // TODO: test/validate value before setting it!
    if (property) {
      await property.___writeValue(value);
    } else { 
      throw new BDError('unknown property', BDErrorCode.UNKNOWN_PROPERTY, BDErrorClass.PROPERTY);    
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
  async ___readProperty(req: ReadPropertyContent): Promise<BDValue | BDValue[]> {
    const { payload: { property } } = req;
    if (this.#properties.has(property.id as BDPropertyIdentifier)) { 
      return this.#properties.get(property.id as BDPropertyIdentifier)!
        .___readValue();
    }
    throw new BDError('unknown property', BDErrorCode.UNKNOWN_PROPERTY, BDErrorClass.PROPERTY);
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
    if (properties.length === 1 && properties[0].id === BDPropertyIdentifier.ALL) { 
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
  #onPropertyBeforeCov = async (property: BDProperty<any, any>, nextValue: BDValue | BDValue[]) => { 
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
  #onPropertyAfterCov = async (property: BDProperty<any, any>, nextValue: BDValue | BDValue[]) => { 
    await this.trigger('aftercov', this, property, nextValue);
  };
    
}