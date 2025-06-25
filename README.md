
# `bacnet-device`

A TypeScript library for implementing BACnet/IP devices in Node.js.

## Status

Under heavy development as of June 2025. For more information, [get in touch][1].

## Characteristics

This library provides a high-level API that simplifies the instantiation and
management of BACnet objects by abstracting network operations (subscription
management, CoV propagation, value updates) and offering classes specific to
individual BACnet object types that automatically instantiate all properties
required by the BACnet specification.

1. **Detailed types**: uses and contributes to [`node-bacnet`][2]'s
   well-defined interfaces, generics, and type definitions that accurately
   model BACnet's complex data structures.
2. **Separation of concerns**: maintains separate classes for BACnet objects,
   properties, and network operations, loosely coupled via events.
3. **Backpressure management**: operations return Promises that resolve only
   after full processing and acknowledgment, creating natural throttling; for 
   example, COV notifications wait for subscriber confirmation before processing
   the next change.
4. **Object-level transactions**: access to property values, whether by other 
   devices in the BACnet network or by consumers of this library, are processed
   through per-object FIFO queues to maintain consistency and prevent race 
   conditions.

This library is built on top of the wonderful [`node-bacnet`][2], a TypeScript
implementation of BACnet's protocol stack maintained by [Innovation System][6].
Any improvement that is applicable to [`node-bacnet`][2] is contributed upstream.

## Documentation

- Source code is available at [https://github.com/jacoscaz/bacnet-device][5].
- API documentation is available at [https://jacoscaz.github.io/bacnet-device][3].
- Supported object types are listed in the [SUPPORTED_OBJECT_TYPES.md][4] file.

## Example usage

```typescript
import { 
  BDDevice,
  BDAnalogInput,
  BDAnalogOutput,
} from './index.js';

import { 
  StatusFlags,
  StatusFlagsBitString,
  EngineeringUnits,
} from '@innovation-system/node-bacnet';

// Create a BACnet node (network interface)
const device = new BDDevice({
  port: 47808,            // Standard BACnet/IP port
  interface: '0.0.0.0',   // Listen on all interfaces
  broadcastAddress: '255.255.255.255',
  instance: 1234,         // Must be unique on the network (0-4194303)
  name: 'My BACnet Device',
  description: 'some description',
  modelName: 'Model XYZ',
  firmwareRevision: '1.0.0',
  applicationSoftwareVersion: '1.0.0',
  databaseRevision: 1
});

// Create and add an Analog Input object
const temperatureSensor = device.addObject(new BDAnalogInput(1, { 
  name: 'Zone Temperature', 
  unit: EngineeringUnits.DEGREES_CELSIUS,
}));

// Create and add an Analog Output object
const damperControl = device.addObject(new BDAnalogOutput(1, {
  name: 'VAV Damper Control',
  unit: EngineeringUnits.PERCENT,
}));

// Listen for BACnet events
device.on('listening', () => {
  console.log('BACnet device is now online!');
  console.log(`Device Instance: ${device.identifier.instance}`);
  
  // Set the initial value of the temperature input
  temperatureSensor.presentValue.setValue(21.5);
  
  // Set the output value with a specific priority (1-16)
  damperControl.presentValue.setValue(75.0);
  
  // You can also manipulate status flags
  temperatureSensor.statusFlags.setValue(
    new StatusFlagsBitString(StatusFlags.OVERRIDDEN)
  );
});

// Simulate changing values
setInterval(() => {
  // Simulate temperature fluctuation
  const currentTemp = temperatureSensor.presentValue.getValue();
  const newTemp = currentTemp + (Math.random() * 0.4 - 0.2); // +/- 0.2°C
  temperatureSensor.presentValue.setValue(newTemp);
  
  console.log(`Temperature updated: ${newTemp.toFixed(1)}°C`);
}, 10000);

// Listen for errors
device.on('error', (err) => {
  console.error('BACnet error:', err);
});
```

[1]: https://github.com/jacoscaz/bacnet-device
[2]: https://github.com/innovation-system/node-bacnet
[3]: https://jacoscaz.github.io/bacnet-device
[4]: https://github.com/jacoscaz/bacnet-device/blob/main/SUPPORTED_OBJECT_TYPES.md
[5]: https://github.com/jacoscaz/bacnet-device
[6]: https://www.innovation-system.it