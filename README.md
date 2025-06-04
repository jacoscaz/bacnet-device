
# `bacnet-device`

A TypeScript library for implementing BACnet IP devices in Node.js.

## Status

Under heavy development as of June 2025. For more information, [get in touch][1].

## Characteristics

1. **Strong TypeScript Integration**: well-defined interfaces, generics, and
   type definitions that accurately model BACnet's complex data structures.
2. **Clean Object-Oriented Design**: separation of concerns between objects,
   properties, and network operations.
3. **Evented Architecture**: uses a custom asynchronous event system.
4. **Queued Property Updates**: ensures that operations are processed
   sequentially, preventing race conditions.

This library provides a high-level, type-safe API built on top of
[`@innovation-system/node-bacnet`][2].


## Example usage

```typescript
import { 
  BACnetNode,
  BACnetDevice,
  EngineeringUnit,
  BACnetAnalogOutput,
} from 'bacnet-device';

const node = new BACnetNode({
  apduTimeout: 6000,
  port: 47808,          // default BACnet UDP port
  interface: '0.0.0.0', // all interfaces
});
const device = node.addDevice(new BACnetDevice(4194301, 'MyTestDevice', 0));

const analogOutput1 = device.addObject(new BACnetAnalogOutput(1, 'outout analogo 1', EngineeringUnit.HERTZ));
const analogOutput2 = device.addObject(new BACnetAnalogOutput(2, 'outout analogo 2', EngineeringUnit.HERTZ));

setInterval(() => { 
  analogOutput2.presentValue.setValue(Date.now() % 42);
}, 1_000);
```

[1]: https://github.com/jacoscaz/bacnet-device
[2]: https://github.com/innovation-system/node-bacnet
