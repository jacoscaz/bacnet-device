# `bacnet-device`

A library for implementing BACnet IP devices.

## Status

Under heavy development as of May 2025. For more information, [get in touch][1].

## Example usage

```typescript
import { 
  BACnetNode,
  BACnetDevice,
  BACnetAnalogOutput,
  EngineeringUnit,
  ObjectType,
  ApplicationTag,
} from 'bacnet-device';

const node = new BACnetNode({
  apduTimeout: 6000,
  port: 47808,          // default BACnet UDP port
  interface: '0.0.0.0', // all interfaces
});

const device = node.addDevice(new BACnetDevice(4194301, 'MyTestDevice', 0));

const analogOutput = device.addObject(new BACnetAnalogOutput(1, 'analog output 1', EngineeringUnit.HERTZ));

setInterval(() => { 
  analogOutput.presentValue.setValue(Date.now() % 42);
}, 1_000);
```

[1]: https://github.com/jacoscaz/bacnet-device
