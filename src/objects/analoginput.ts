
import { BACnetSingletProperty } from '../properties/index.js';
import { BACnetObject } from '../object.js';
import { ApplicationTag, ObjectType, PropertyIdentifier } from '../enums/index.js';
import { EventState, EngineeringUnit, Reliability } from '../enums/index.js';
import { StatusFlagsBitString } from '../bitstrings/index.js';

/**
 * Implements a BACnet Analog Input object, which represents a physical analog
 * input such as a temperature sensor, pressure sensor, etc.
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
 */
export class BACnetAnalogInput extends BACnetObject {
  
  readonly presentValue: BACnetSingletProperty<ApplicationTag.REAL>;
  readonly statusFlags: BACnetSingletProperty<ApplicationTag.BIT_STRING>;
  readonly eventState: BACnetSingletProperty<ApplicationTag.ENUMERATED, EventState>;
  readonly engineeringUnit: BACnetSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnit>;
  readonly outOfService: BACnetSingletProperty<ApplicationTag.BOOLEAN>;
  readonly reliability: BACnetSingletProperty<ApplicationTag.ENUMERATED, Reliability>;
  
  constructor(instance: number, name: string, unit: EngineeringUnit) {
    super(ObjectType.ANALOG_INPUT, instance, name);
    
    this.presentValue = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, false, 0));
    
    this.statusFlags = this.addProperty(new BACnetSingletProperty<ApplicationTag.BIT_STRING, StatusFlagsBitString>(
      PropertyIdentifier.STATUS_FLAGS, ApplicationTag.BIT_STRING, false, new StatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, EventState>(
      PropertyIdentifier.EVENT_STATE, ApplicationTag.ENUMERATED, false, EventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnit>(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, unit));
    
    this.outOfService = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, false));
    
    this.reliability = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, Reliability>(
      PropertyIdentifier.RELIABILITY, ApplicationTag.ENUMERATED, false, Reliability.NO_FAULT_DETECTED));
    
  }
  
}