
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from '../object.js';
import { BDApplicationTag, BDObjectType, BDPropertyIdentifier } from '../enums/index.js';
import { BDEventState, BDEngineeringUnit, BDReliability } from '../enums/index.js';
import { BDStatusFlagsBitString } from '../bitstrings/index.js';

export interface BDAnalogInputOpts { 
  name: string, 
  unit: BDEngineeringUnit, 
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
  readonly presentValue: BDSingletProperty<BDApplicationTag.REAL>;
  
  readonly maxPresentValue: BDSingletProperty<BDApplicationTag.REAL>;
  
  readonly minPresentValue: BDSingletProperty<BDApplicationTag.REAL>;
  
  /**
   * The current status flags for this object
   * 
   * This property contains four flags: IN_ALARM, FAULT, OVERRIDDEN, and OUT_OF_SERVICE.
   * These flags provide a summary of the object's current status.
   */
  readonly statusFlags: BDSingletProperty<BDApplicationTag.BIT_STRING>;
  
  /**
   * The current event state of this object
   * 
   * This property indicates whether the object is in an alarm condition.
   * For objects that do not support event reporting, this is typically NORMAL.
   */
  readonly eventState: BDSingletProperty<BDApplicationTag.ENUMERATED, BDEventState>;
  
  /**
   * The engineering units for the present value
   * 
   * This property specifies the units of measurement for the present value,
   * such as degrees Celsius, Pascal, etc.
   */
  readonly engineeringUnit: BDSingletProperty<BDApplicationTag.ENUMERATED, BDEngineeringUnit>;
  
  /**
   * Indicates whether this object is out of service
   * 
   * When true, the Present_Value property is decoupled from the physical input
   * and can be modified directly for testing or other purposes.
   */
  readonly outOfService: BDSingletProperty<BDApplicationTag.BOOLEAN>;
  
  /**
   * The reliability of the present value
   * 
   * This property indicates whether the Present_Value is reliable and why it
   * might be unreliable (e.g., sensor failure, communication failure, etc.).
   */
  readonly reliability: BDSingletProperty<BDApplicationTag.ENUMERATED, BDReliability>;
  
  readonly covIncrement: BDSingletProperty<BDApplicationTag.REAL>;
  
  /**
   * Creates a new BACnet Analog Input object
   */
  constructor(instance: number, opts: BDAnalogInputOpts) {
    super(BDObjectType.ANALOG_INPUT, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.PRESENT_VALUE, BDApplicationTag.REAL, false, opts.presentValue ?? 0));
    
    this.statusFlags = this.addProperty(new BDSingletProperty<BDApplicationTag.BIT_STRING, BDStatusFlagsBitString>(
      BDPropertyIdentifier.STATUS_FLAGS, BDApplicationTag.BIT_STRING, false, new BDStatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BDSingletProperty<BDApplicationTag.ENUMERATED, BDEventState>(
      BDPropertyIdentifier.EVENT_STATE, BDApplicationTag.ENUMERATED, false, BDEventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty<BDApplicationTag.ENUMERATED, BDEngineeringUnit>(
      BDPropertyIdentifier.UNITS, BDApplicationTag.ENUMERATED, false, opts.unit));
    
    this.outOfService = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.OUT_OF_SERVICE, BDApplicationTag.BOOLEAN, false, false));
    
    this.reliability = this.addProperty(new BDSingletProperty<BDApplicationTag.ENUMERATED, BDReliability>(
      BDPropertyIdentifier.RELIABILITY, BDApplicationTag.ENUMERATED, false, BDReliability.NO_FAULT_DETECTED));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.COV_INCREMENT, BDApplicationTag.REAL, false, opts.covIncrement ?? 0.001));
    
    this.maxPresentValue = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.MAX_PRES_VALUE, BDApplicationTag.REAL, false, opts.maxPresentValue ?? Number.MAX_SAFE_INTEGER));
    
    this.minPresentValue = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.MIN_PRES_VALUE, BDApplicationTag.REAL, false, opts.minPresentValue ?? Number.MIN_SAFE_INTEGER));
    
  }
  
}