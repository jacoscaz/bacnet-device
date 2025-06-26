
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import { 
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@innovation-system/node-bacnet';

export interface BDCharacterStringValueOpts { 
  name: string, 
  writable?: boolean,
  description?: string,
  presentValue?: string,
}

export class BDCharacterStringValue extends BDObject { 
  
  readonly presentValue: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  
  constructor(instance: number, opts: BDCharacterStringValueOpts) {
    super(ObjectType.CHARACTERSTRING_VALUE, instance, opts.name, opts.description);
    
    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.CHARACTER_STRING, opts.writable ?? false, opts.presentValue ?? ''));

  }
}
