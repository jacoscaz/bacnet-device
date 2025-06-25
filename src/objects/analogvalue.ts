
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import { 
  ObjectType,
  ApplicationTag,
  EngineeringUnits,
  PropertyIdentifier,
} from '@innovation-system/node-bacnet';

export interface BDAnalogValueOpts { 
  name: string, 
  unit: EngineeringUnits, 
  description?: string,
  presentValue?: number,
  covIncrement?: number,
}

export class BDAnalogValue extends BDObject { 
  
  readonly presentValue: BDSingletProperty<ApplicationTag.REAL>;
  readonly covIncrement: BDSingletProperty<ApplicationTag.REAL>;
  readonly engineeringUnit: BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>;
  
  constructor(instance: number, opts: BDAnalogValueOpts) {
    super(ObjectType.ANALOG_VALUE, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.REAL, true, opts.presentValue ?? 0));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, opts.unit));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, ApplicationTag.REAL, true, opts.covIncrement ?? 0));

  }
}
