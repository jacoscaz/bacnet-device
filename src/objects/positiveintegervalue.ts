
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import { 
  ObjectType,
  ApplicationTag,
  EngineeringUnits,
  PropertyIdentifier,
} from '@innovation-system/node-bacnet';

export interface BDPositiveIntegerValueOpts { 
  name: string, 
  unit: EngineeringUnits, 
  description?: string,
  presentValue?: number,
  covIncrement?: number,
}

export class BDPositiveIntegerValue extends BDObject { 
  
  readonly presentValue: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly covIncrement: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly engineeringUnit: BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>;
  
  constructor(instance: number, opts: BDPositiveIntegerValueOpts) {
    super(ObjectType.POSITIVE_INTEGER_VALUE, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.UNSIGNED_INTEGER, true, opts.presentValue ?? 0));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, opts.unit));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, ApplicationTag.UNSIGNED_INTEGER, true, opts.covIncrement ?? 0));
  
  }
}
