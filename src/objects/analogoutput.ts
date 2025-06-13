
import type { BDValue } from '../value.js';

import { BDSingletProperty, BDArrayProperty } from '../properties/index.js';
import { BDObject } from '../object.js';
import { BDApplicationTag, BDObjectType, BDPropertyIdentifier } from '../enums/index.js';
import { BDEventState, BDEngineeringUnit } from '../enums/index.js';
import { BDStatusFlagsBitString } from '../bitstrings/index.js';

export interface BDAnalogOutputOpts { 
  name: string, 
  unit: BDEngineeringUnit, 
  description?: string,
  minPresentValue?: number,
  maxPresentValue?: number,
  presentValue?: number,
  covIncrement?: number,
}

/**
 * Implements a BACnet Analog Output object
 * 
 * The Analog Output object represents a physical or virtual analog output point such as a
 * control valve, damper actuator, or other output device. This object type provides a standard
 * way to represent and control analog outputs in BACnet systems.
 * 
 * Required properties according to the BACnet specification:
 * - Object_Identifier (automatically added by BACnetObject)
 * - Object_Name (automatically added by BACnetObject)
 * - Object_Type (automatically added by BACnetObject)
 * - Present_Value (writable)
 * - Status_Flags
 * - Event_State
 * - Out_Of_Service
 * - Units
 * - Priority_Array
 * - Relinquish_Default
 * 
 * @extends BDObject
 */
export class BDAnalogOutput extends BDObject {
  
  /** 
   * The current value of the analog output
   * 
   * This property represents the commanded value for the analog output in the
   * units specified by the engineeringUnit property. The actual value is determined
   * by the priority array mechanism.
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
   * When true, the Present_Value property is decoupled from the physical output
   * and can be modified directly for testing or other purposes.
   */
  readonly outOfService: BDSingletProperty<BDApplicationTag.BOOLEAN>;
  
  /**
   * The default value for the present value when all priority array slots are NULL
   * 
   * This property represents the value to be used for the Present_Value property
   * when all entries in the Priority_Array property are NULL.
   */
  readonly relinquishDefault: BDSingletProperty<BDApplicationTag.REAL>;
  
  /**
   * The priority array for command arbitration
   * 
   * This property represents the 16-level priority array used for command arbitration.
   * BACnet devices use this mechanism to determine which command source has control
   * over the output value at any given time.
   */
  readonly priorityArray: BDArrayProperty<BDApplicationTag.REAL | BDApplicationTag.NULL>;
  
  /**
   * The current command priority that is controlling the Present_Value
   * 
   * This property indicates which priority level in the priority array currently
   * has control of the Present_Value property, or NULL if the Relinquish_Default
   * is being used.
   */
  readonly currentCommandPriority: BDSingletProperty<BDApplicationTag.UNSIGNED_INTEGER | BDApplicationTag.NULL>;
  
  readonly covIncrement: BDSingletProperty<BDApplicationTag.REAL>;
  
  /**
   * Creates a new BACnet Analog Output object
   */
  constructor(instance: number, opts: BDAnalogOutputOpts) {
    super(BDObjectType.ANALOG_OUTPUT, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.PRESENT_VALUE, BDApplicationTag.REAL, true, opts.presentValue ?? 0));
    
    this.statusFlags = this.addProperty(new BDSingletProperty<BDApplicationTag.BIT_STRING, BDStatusFlagsBitString>(
      BDPropertyIdentifier.STATUS_FLAGS, BDApplicationTag.BIT_STRING, false, new BDStatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BDSingletProperty<BDApplicationTag.ENUMERATED, BDEventState>(
      BDPropertyIdentifier.EVENT_STATE, BDApplicationTag.ENUMERATED, false, BDEventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty<BDApplicationTag.ENUMERATED, BDEngineeringUnit>(
      BDPropertyIdentifier.UNITS, BDApplicationTag.ENUMERATED, false, opts.unit));
    
    this.outOfService  = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.OUT_OF_SERVICE, BDApplicationTag.BOOLEAN, false, false));
    
    this.relinquishDefault = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.RELINQUISH_DEFAULT, BDApplicationTag.REAL, false, 0));
    
    this.priorityArray = this.addProperty(new BDArrayProperty(
      BDPropertyIdentifier.PRIORITY_ARRAY,
      BDApplicationTag.REAL | BDApplicationTag.NULL,
      false,
      new Array(16).fill({ type: BDApplicationTag.NULL, value: null } as BDValue<BDApplicationTag.REAL | BDApplicationTag.NULL>),
    ));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.COV_INCREMENT, BDApplicationTag.REAL, false, opts.covIncrement ?? 0.001));
   
    this.maxPresentValue = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.MAX_PRES_VALUE, BDApplicationTag.REAL, false, opts.maxPresentValue ?? Number.MAX_SAFE_INTEGER));
    
    this.minPresentValue = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.MIN_PRES_VALUE, BDApplicationTag.REAL, false, opts.minPresentValue ?? Number.MIN_SAFE_INTEGER));
    
    this.currentCommandPriority = this.addProperty(new BDSingletProperty(
      BDPropertyIdentifier.CURRENT_COMMAND_PRIORITY, BDApplicationTag.UNSIGNED_INTEGER | BDApplicationTag.NULL, false, null as number | null));
    
  }
  
}