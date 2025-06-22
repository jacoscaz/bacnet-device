
import { 
  type BACNetAppData,
  type ApplicationTagValueTypeMap,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
  CharacterStringEncoding,
} from '@innovation-system/node-bacnet';

import { BACNetError } from '../errors.js';

export const throwNotWritable = () => {
  throw new BACNetError('not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
};

/**
 * Implementation of the BACNetAppData interface that polls the value using
 * the provided `fetch` function.
 */
export class BACNetAppDataPolled<Tag extends ApplicationTag, Type extends ApplicationTagValueTypeMap[Tag]> implements BACNetAppData<Tag, Type> {
  
  readonly type: Tag;
  readonly value!: Type;
  readonly encoding: CharacterStringEncoding | undefined;
  
  constructor(type: Tag, fetch: () => Type, encoding?: CharacterStringEncoding) {
    this.type = type;
    this.encoding = encoding;
    Object.defineProperty(this, 'value', {
      get: fetch,
      set: throwNotWritable,
    });
  }

}

