
import type { BACnetValue } from '../value.js';

import { BACnetSingletProperty, BACnetArrayProperty } from '../properties/index.js';
import { BACnetObject } from '../object.js';
import { ApplicationTag, ObjectType, PropertyIdentifier } from '../enums/index.js';
import { EventState, EngineeringUnit } from '../enums/index.js';
import { StatusFlagsBitString } from '../bitstrings/index.js';


export class BACnetAnalogOutput extends BACnetObject {
  
  readonly presentValue: BACnetSingletProperty<ApplicationTag.REAL>;
  readonly statusFlags: BACnetSingletProperty<ApplicationTag.BIT_STRING>;
  readonly eventState: BACnetSingletProperty<ApplicationTag.ENUMERATED, EventState>;
  readonly engineeringUnit: BACnetSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnit>;
  readonly outOfService: BACnetSingletProperty<ApplicationTag.BOOLEAN>;
  readonly relinquishDefault: BACnetSingletProperty<ApplicationTag.REAL>;
  readonly priorityArray: BACnetArrayProperty<ApplicationTag.REAL | ApplicationTag.NULL>;
  readonly currentCommandPriority: BACnetSingletProperty<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL>;
  
  constructor(instance: number, name: string, unit: EngineeringUnit) {
    super(ObjectType.ANALOG_OUTPUT, instance, name);
    
    this.presentValue = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, true, 0));
    
    this.statusFlags = this.addProperty(new BACnetSingletProperty<ApplicationTag.BIT_STRING, StatusFlagsBitString>(
      PropertyIdentifier.STATUS_FLAGS, ApplicationTag.BIT_STRING, false, new StatusFlagsBitString()));
    
    this.eventState = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, EventState>(
      PropertyIdentifier.EVENT_STATE, ApplicationTag.ENUMERATED, false, EventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BACnetSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnit>(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, unit));
    
    this.outOfService  = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, false));
    
    this.relinquishDefault = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.RELINQUISH_DEFAULT, ApplicationTag.REAL, false, 0));
    
    this.priorityArray = this.addProperty(new BACnetArrayProperty(
      PropertyIdentifier.PRIORITY_ARRAY,
      ApplicationTag.REAL | ApplicationTag.NULL,
      false,
      new Array(16).fill({ type: ApplicationTag.NULL, value: null } as BACnetValue<ApplicationTag.REAL | ApplicationTag.NULL>),
    ));
    
    this.currentCommandPriority = this.addProperty(new BACnetSingletProperty(
      PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, false, null as number | null));
    
  }
  
}