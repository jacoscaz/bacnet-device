
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import { 
  ObjectType,
  ApplicationTag,
  EventState,
  EngineeringUnits,
  Reliability,
  PropertyIdentifier,
  StatusFlagsBitString,
} from '@innovation-system/node-bacnet';

export interface BDAnalogInputOpts { 
  name: string, 
  unit: EngineeringUnits, 
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
 * @extends BDObject
 */
export class BDAnalogInput extends BDObject {
  
  /** 
   * The current value of the analog input
   * 
   * This property represents the current value of the analog input in the
   * units specified by the engineeringUnit property. It's read-only unless
   * outOfService is set to true.
   */
  readonly presentValue: BDSingletProperty<ApplicationTag.REAL>;
  
  readonly maxPresentValue: BDSingletProperty<ApplicationTag.REAL>;
  
  readonly minPresentValue: BDSingletProperty<ApplicationTag.REAL>;
  
  /**
   * The current status flags for this object
   * 
   * This property contains four flags: IN_ALARM, FAULT, OVERRIDDEN, and OUT_OF_SERVICE.
   * These flags provide a summary of the object's current status.
   */
  readonly statusFlags: BDSingletProperty<ApplicationTag.BIT_STRING>;
  
  /**
   * The current event state of this object
   * 
   * This property indicates whether the object is in an alarm condition.
   * For objects that do not support event reporting, this is typically NORMAL.
   */
  readonly eventState: BDSingletProperty<ApplicationTag.ENUMERATED, EventState>;
  
  /**
   * The engineering units for the present value
   * 
   * This property specifies the units of measurement for the present value,
   * such as degrees Celsius, Pascal, etc.
   */
  readonly engineeringUnit: BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>;
  
  /**
   * Indicates whether this object is out of service
   * 
   * When true, the Present_Value property is decoupled from the physical input
   * and can be modified directly for testing or other purposes.
   */
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;
  
  /**
   * The reliability of the present value
   * 
   * This property indicates whether the Present_Value is reliable and why it
   * might be unreliable (e.g., sensor failure, communication failure, etc.).
   */
  readonly reliability: BDSingletProperty<ApplicationTag.ENUMERATED, Reliability>;
  
  readonly covIncrement: BDSingletProperty<ApplicationTag.REAL>;
  
  /**
   * Creates a new BACnet Analog Input object
   */
  constructor(instance: number, opts: BDAnalogInputOpts) {
    super(ObjectType.ANALOG_INPUT, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, false, opts.presentValue ?? 0));
    
    this.statusFlags = this.addProperty(new BDSingletProperty<ApplicationTag.BIT_STRING, StatusFlagsBitString>(
      PropertyIdentifier.STATUS_FLAGS, ApplicationTag.BIT_STRING, false, new StatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, EventState>(
      PropertyIdentifier.EVENT_STATE, ApplicationTag.ENUMERATED, false, EventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, opts.unit));
    
    this.outOfService = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, false));
    
    this.reliability = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, Reliability>(
      PropertyIdentifier.RELIABILITY, ApplicationTag.ENUMERATED, false, Reliability.NO_FAULT_DETECTED));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, ApplicationTag.REAL, false, opts.covIncrement ?? 0.001));
    
    this.maxPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MAX_PRES_VALUE, ApplicationTag.REAL, false, opts.maxPresentValue ?? Number.MAX_SAFE_INTEGER));
    
    this.minPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MIN_PRES_VALUE, ApplicationTag.REAL, false, opts.minPresentValue ?? Number.MIN_SAFE_INTEGER));
    
  }
  
}