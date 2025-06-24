
/**
 * BACnet object implementation module
 * 
 * This module provides the base implementation for BACnet objects,
 * which are the core components of BACnet devices.
 * 
 * @module
 */

import { AsyncEventEmitter, type EventMap } from './events.js';

import { BDError } from './errors.js';

import {
  type BACNetAppData,
  type BACNetObjectID,
  type BACNetPropertyID,
  type BACNetReadAccess,
  ErrorCode,
  ErrorClass,
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@innovation-system/node-bacnet';

import type { 
  ReadPropertyMultipleContent,
} from '@innovation-system/node-bacnet/dist/lib/EventTypes.js';

import {
  BDAbstractProperty,
  BDSingletProperty,
  BDArrayProperty,
} from './properties/index.js';

import { ensureArray } from './utils.js';

import { MAX_ARRAY_INDEX } from './constants.js';

/**
 * Events that can be emitted by a BACnet object
 */
export interface BDObjectEvents extends EventMap { 
  /** Emitted after a property value has changed */
  aftercov: [object: BDObject, property: BDAbstractProperty<any, any, any>, newValue: BACNetAppData | BACNetAppData[]],
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
 * @extends AsyncEventEmitter<BDObjectEvents>
 */
export class BDObject extends AsyncEventEmitter<BDObjectEvents> {
  
  /** The unique identifier for this object (type and instance number) */
  readonly identifier: BACNetObjectID;
  
  /** 
   * The list of properties in this object (used for PROPERTY_LIST property)
   * @private
   */
  readonly #propertyList: BACNetAppData<ApplicationTag.ENUMERATED, PropertyIdentifier>[];
  
  /**
   * Map of all properties in this object by their identifier
   * @private
   */
  readonly #properties: Map<PropertyIdentifier, BDAbstractProperty<any, any, any>>;
  
  readonly objectName: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  
  readonly objectType: BDSingletProperty<ApplicationTag.ENUMERATED, ObjectType>;
  
  readonly objectIdentifier: BDSingletProperty<ApplicationTag.OBJECTIDENTIFIER>;
  
  readonly propertyList: BDArrayProperty<ApplicationTag.ENUMERATED, PropertyIdentifier>;
  
  readonly description: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  
  /**
   * Creates a new BACnet object
   * 
   * @param type - The BACnet object type
   * @param instance - The instance number for this object
   * @param name - The name of this object
   */
  constructor(type: ObjectType, instance: number, name: string, description: string = 'w') {
    super();
    
    this.identifier = Object.freeze({ type, instance });
    this.#properties = new Map();
    this.#propertyList = [];
    
    this.objectName = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.OBJECT_NAME, ApplicationTag.CHARACTER_STRING, false, name));
    
    this.objectType = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.OBJECT_TYPE, ApplicationTag.ENUMERATED, false, type));
    
    this.objectIdentifier = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.OBJECT_IDENTIFIER, ApplicationTag.OBJECTIDENTIFIER, false, this.identifier));
    
    this.propertyList = this.addProperty(new BDArrayProperty<ApplicationTag.ENUMERATED, PropertyIdentifier>(
      PropertyIdentifier.PROPERTY_LIST, false,  () => this.#propertyList));
    
    this.description = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.DESCRIPTION, ApplicationTag.CHARACTER_STRING, false, description ?? 'w'));
    
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
  addProperty<T extends BDAbstractProperty<any, any, any>>(property: T): T { 
    if (this.#properties.has(property.identifier)) { 
      throw new Error('Cannot register property: duplicate property identifier');
    }
    this.#properties.set(property.identifier, property);
    if (!unlistedProperties.includes(property.identifier)) { 
      this.#propertyList.push({ type: ApplicationTag.ENUMERATED, value: property.identifier });
    }
    property.on('aftercov', this.#onPropertyAfterCov);
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
  async ___writeProperty(identifier: BACNetPropertyID, value: BACNetAppData | BACNetAppData[]): Promise<void> {
    const property = this.#properties.get(identifier.id as PropertyIdentifier);
    // TODO: test/validate value before setting it!
    if (property) {
      await property.___writeData(value);
    } else { 
      throw new BDError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);    
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
  async ___readProperty(property: BACNetPropertyID): Promise<BACNetAppData | BACNetAppData[]> {
    if (this.#properties.has(property.id as PropertyIdentifier)) { 
      return this.#properties.get(property.id as PropertyIdentifier)!
        .___readData(property.index);
    }
    throw new BDError('unknown property', ErrorCode.UNKNOWN_PROPERTY, ErrorClass.PROPERTY);
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
      values.push({ 
        property: { id: identifier, index: MAX_ARRAY_INDEX }, 
        value: ensureArray(property.___readData(MAX_ARRAY_INDEX)),
      });
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
        values.push({ property, value: ensureArray(this.#properties.get(property.id)!.___readData(property.index)) });
      }
    }
    return { objectId: this.identifier, values };
  }
  
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
  #onPropertyAfterCov = async (property: BDAbstractProperty<any, any, any>, nextValue: BACNetAppData | BACNetAppData[]) => { 
    await this.___asyncEmitSeries(false, 'aftercov', this, property, nextValue);
  };
    
}