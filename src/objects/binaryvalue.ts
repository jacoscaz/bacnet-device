
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import { 
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@innovation-system/node-bacnet';

export interface BDBinaryValueOpts { 
  name: string, 
  writable: boolean,
  description?: string,
  presentValue?: boolean,
}

export class BDBinaryValue extends BDObject { 
  
  readonly presentValue: BDSingletProperty<ApplicationTag.BOOLEAN>;
  
  constructor(instance: number, opts: BDBinaryValueOpts) {
    super(ObjectType.BINARY_VALUE, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.BOOLEAN, opts.writable ?? false, opts.presentValue ?? false));

  }
}
