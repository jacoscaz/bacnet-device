# `bacnet-device`

A library for implementing BACnet IP devices.

## Status

Under heavy development as of June 2025. For more information, [get in touch][1].

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
