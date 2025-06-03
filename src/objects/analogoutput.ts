
import { BACnetScalarProperty } from '../properties/index.js';

import { BACnetObject } from '../object.js';
import { ApplicationTag, ObjectType, PropertyIdentifier } from '../enums/index.js';
import { EventState, EngineeringUnit } from '../enums/index.js';
import { StatusFlagsBitString } from '../bitstrings.js';

export class BACnetAnalogOutput extends BACnetObject {
  
  readonly presentValue: BACnetScalarProperty<ApplicationTag.REAL>;
  readonly statusFlags: BACnetScalarProperty<ApplicationTag.BIT_STRING>;
  // readonly eventState: BACnetScalarProperty<ApplicationTag.ENUMERATED, EventState>;
  readonly engineeringUnit: BACnetScalarProperty<ApplicationTag.ENUMERATED, EngineeringUnit>;
  readonly outOfService: BACnetScalarProperty<ApplicationTag.BOOLEAN>;
  
  constructor(instance: number, name: string, unit: EngineeringUnit) {
    super(ObjectType.ANALOG_OUTPUT, instance, name);
    
    this.presentValue = this.addProperty(new BACnetScalarProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, true, 0));
    
    this.statusFlags = this.addProperty(new BACnetScalarProperty<ApplicationTag.BIT_STRING, StatusFlagsBitString>(
      PropertyIdentifier.STATUS_FLAGS, ApplicationTag.BIT_STRING, false, new StatusFlagsBitString(0, 0, 0, 0)));
    
    // TODO: this is causing YABE to throw an error - figure out why
    // this.eventState = this.addProperty(new BACnetScalarProperty<ApplicationTag.ENUMERATED, EventState>(
    //   PropertyIdentifier.EVENT_STATE, ApplicationTag.ENUMERATED, false, EventState.NORMAL));
    
    this.engineeringUnit = this.addProperty(new BACnetScalarProperty<ApplicationTag.ENUMERATED, EngineeringUnit>(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, unit));
    
    this.outOfService  = this.addProperty(new BACnetScalarProperty(
      PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, false));
  }
  
}

