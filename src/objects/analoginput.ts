
import { BACnetSingletProperty } from '../properties/index.js';
import { BACnetObject } from '../object.js';
import { ApplicationTag, ObjectType, PropertyIdentifier } from '../enums/index.js';
import { EventState, EngineeringUnit, Reliability } from '../enums/index.js';
import { StatusFlagsBitString } from '../bitstrings/index.js';

export interface BACnetAnalogInputOpts { 
  name: string, 
  unit: EngineeringUnit, 
  description?: string,
  minPresentValue?: number,
  maxPresentValue?: number,
  presentValue?: number,
  covIncrement?: number,
}

/**
 * Implements a BACnet Analog Input object
 * 
 * The Analog Input object represents a physical or virtual analog input source such as a
 * temperature sensor, pressure sensor, or other analog measurement device. This object
 * type provides a standard way to represent analog inputs in BACnet systems.
 * 
 * Required properties according to the BACnet specification:
 * - Object_Identifier (automatically added by BACnetObject)
 * - Object_Name (automatically added by BACnetObject)
 * - Object_Type (automatically added by BACnetObject)
 * - Present_Value (read-only unless Out_Of_Service is true)
 * - Status_Flags
 * - Event_State
 * - Out_Of_Service
 * - Units
 * - Reliability (optional but commonly included)
 * 
 * @extends BACnetObject
 */
export class BACnetAnalogInput extends BACnetObject {
  
  /** 
   * The current value of the analog input
   * 
   * This property represents the current value of the analog input in the
   * units specified by the engineeringUnit property. It's read-only unless
   * outOfService is set to true.
   */
  readonly presentValue: BACnetSingletProperty<ApplicationTag.REAL>;
  
  readonly maxPresentValue: BACnetSingletProperty<ApplicationTag.REAL>;
  
  readonly minPresentValue: BACnetSingletProperty<ApplicationTag.REAL>;
  
  /**
   * The current status flags for this object
   * 
   * This property contains four flags: IN_ALARM, FAULT, OVERRIDDEN, and OUT_OF_SERVICE.
   * These flags provide a summary of the object's current status.
   */
  readonly statusFlags: BACnetSingletProperty<ApplicationTag.BIT_STRING>;
  
  /**
   * The current event state of this object
   * 
   * This property indicates whether the object is in an alarm condition.
   * For objects that do not support event reporting, this is typically NORMAL.
   */
  readonly eventState: BACnetSingletProperty<ApplicationTag.ENUMERATED, EventState>;
  
  /**
   * The engineering units for the present value
   * 
   * This property specifies the units of measurement for the present value,
   * such as degrees Celsius, Pascal, etc.
   */
  readonly engineeringUnit: BACnetSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnit>;
  
  /**
   * Indicates whether this object is out of service
   * 
   * When true, the Present_Value property is decoupled from the physical input
   * and can be modified directly for testing or other purposes.
   */
  readonly outOfService: BACnetSingletProperty<ApplicationTag.BOOLEAN>;
  
  /**
   * The reliability of the present value
   * 
   * This property indicates whether the Present_Value is reliable and why it
   * might be unreliable (e.g., sensor failure, communication failure, etc.).
   */
  readonly reliability: BACnetSingletProperty<ApplicationTag.ENUMERATED, Reliability>;
  
  readonly covIncrement: BACnetSingletProperty<ApplicationTag.REAL>;
  
  /**
   * Creates a new BACnet Analog Input object
   * 
   * @param instance - The instance number for this object (must be unique for this type)
   * @param name - The name of this object
   * @param unit - The engineering unit for this analog input's present value
   */
  constructor(instance: number, opts: BACnetAnalogInputOpts) {
    super(ObjectType.ANALOG_INPUT, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, false, opts.presentValue ?? 0));
    
    this.statusFlags = this.addProperty(new BACnetSingletProperty<ApplicationTag.BIT_STRING, StatusFlagsBitString>(
      PropertyIdentifier.STATUS_FLAGS, ApplicationTag.BIT_STRING, false, new StatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, EventState>(
      PropertyIdentifier.EVENT_STATE, ApplicationTag.ENUMERATED, false, EventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnit>(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, opts.unit));
    
    this.outOfService = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, false));
    
    this.reliability = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, Reliability>(
      PropertyIdentifier.RELIABILITY, ApplicationTag.ENUMERATED, false, Reliability.NO_FAULT_DETECTED));
    
    this.covIncrement = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.COV_INCREMENT, ApplicationTag.REAL, false, opts.covIncrement ?? 0.001));
    
    this.maxPresentValue = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.MAX_PRES_VALUE, ApplicationTag.REAL, false, opts.maxPresentValue ?? Number.MAX_SAFE_INTEGER));
    
    this.minPresentValue = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.MIN_PRES_VALUE, ApplicationTag.REAL, false, opts.minPresentValue ?? Number.MIN_SAFE_INTEGER));
    
  }
  
}