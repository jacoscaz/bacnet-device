
import { BDSingletProperty, BDArrayProperty } from '../properties/index.js';
import { BDObject } from '../object.js';
import { 
  type BACNetAppData,
  ObjectType,
  ApplicationTag,
  EventState,
  EngineeringUnits,
  PropertyIdentifier,
  StatusFlagsBitString,
} from '@innovation-system/node-bacnet';

export interface BDAnalogOutputOpts { 
  name: string, 
  unit: EngineeringUnits, 
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
   * When true, the Present_Value property is decoupled from the physical output
   * and can be modified directly for testing or other purposes.
   */
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;
  
  /**
   * The default value for the present value when all priority array slots are NULL
   * 
   * This property represents the value to be used for the Present_Value property
   * when all entries in the Priority_Array property are NULL.
   */
  readonly relinquishDefault: BDSingletProperty<ApplicationTag.REAL>;
  
  /**
   * The priority array for command arbitration
   * 
   * This property represents the 16-level priority array used for command arbitration.
   * BACnet devices use this mechanism to determine which command source has control
   * over the output value at any given time.
   */
  readonly priorityArray: BDArrayProperty<ApplicationTag.REAL | ApplicationTag.NULL>;
  
  /**
   * The current command priority that is controlling the Present_Value
   * 
   * This property indicates which priority level in the priority array currently
   * has control of the Present_Value property, or NULL if the Relinquish_Default
   * is being used.
   */
  readonly currentCommandPriority: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL>;
  
  readonly covIncrement: BDSingletProperty<ApplicationTag.REAL>;
  
  /**
   * Creates a new BACnet Analog Output object
   */
  constructor(instance: number, opts: BDAnalogOutputOpts) {
    super(ObjectType.ANALOG_OUTPUT, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, true, opts.presentValue ?? 0));
    
    this.statusFlags = this.addProperty(new BDSingletProperty<ApplicationTag.BIT_STRING, StatusFlagsBitString>(
      PropertyIdentifier.STATUS_FLAGS, ApplicationTag.BIT_STRING, false, new StatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, EventState>(
      PropertyIdentifier.EVENT_STATE, ApplicationTag.ENUMERATED, false, EventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, opts.unit));
    
    this.outOfService  = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, false));
    
    this.relinquishDefault = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.RELINQUISH_DEFAULT, ApplicationTag.REAL, false, 0));
    
    this.priorityArray = this.addProperty(new BDArrayProperty(
      PropertyIdentifier.PRIORITY_ARRAY,
      ApplicationTag.REAL | ApplicationTag.NULL,
      false,
      new Array(16).fill({ type: ApplicationTag.NULL, value: null } as BACNetAppData<ApplicationTag.REAL | ApplicationTag.NULL>),
    ));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, ApplicationTag.REAL, false, opts.covIncrement ?? 0.001));
   
    this.maxPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MAX_PRES_VALUE, ApplicationTag.REAL, false, opts.maxPresentValue ?? Number.MAX_SAFE_INTEGER));
    
    this.minPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MIN_PRES_VALUE, ApplicationTag.REAL, false, opts.minPresentValue ?? Number.MIN_SAFE_INTEGER));
    
    this.currentCommandPriority = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, false, null as number | null));
    
  }
  
}