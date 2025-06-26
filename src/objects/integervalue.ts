
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import { 
  ObjectType,
  ApplicationTag,
  EngineeringUnits,
  PropertyIdentifier,
} from '@innovation-system/node-bacnet';

export interface BDIntegerValueOpts { 
  name: string, 
  unit: EngineeringUnits, 
  writable?: boolean,
  description?: string,
  presentValue?: number,
  covIncrement?: number,
}

export class BDIntegerValue extends BDObject { 
  
  readonly presentValue: BDSingletProperty<ApplicationTag.SIGNED_INTEGER>;
  readonly covIncrement: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly engineeringUnit: BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>;
  
  constructor(instance: number, opts: BDIntegerValueOpts) {
    super(ObjectType.INTEGER_VALUE, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.SIGNED_INTEGER, opts.writable ?? false, opts.presentValue ?? 0));
    
    this.engineeringUnit = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, false, opts.unit));
    
    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, ApplicationTag.UNSIGNED_INTEGER, true, opts.covIncrement ?? 0));

  }
}
