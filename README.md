
# `bacnet-device`

A TypeScript library for implementing BACnet/IP devices in Node.js.

## Status

Under heavy development as of June 2025. For more information, [get in touch][1].

## Characteristics

1. **Detailed types**: maintains well-defined interfaces, generics, and type
   definitions  that accurately model BACnet's complex data structures.
2. **Separation of concerns**: maintains separate classes for BACnet objects,
   properties, and network operations, loosely coupled via events.
3. **Backpressure management**: operations return Promises that resolve only
   after full processing and acknowledgment, creating natural throttling - for 
   example, COV notifications wait for subscriber confirmation before processing
   the next change.
4. **Sequential property updates**: value change operations, whether internal
   or coming in via the BACnet network, are processed through FIFO queues,
   preventing race conditions.

This library provides a high-level, type-safe API built on top of the wonderful
[`@innovation-system/node-bacnet`][2].

## Documentation

- Source code is available at [https://github.com/jacoscaz/bacnet-device][5].
- API documentation is available at [https://jacoscaz.github.io/bacnet-device][3].
- Supported object types are listed in the [SUPPORTED_OBJECT_TYPES.md][4] file.

## Example usage

```typescript
import { 
  BACnetDevice,
  BACnetAnalogInput,
  BACnetAnalogOutput,
  EngineeringUnit,
  StatusFlagsBit,
  StatusFlagsBitString
} from './index.js';

// Create a BACnet node (network interface)
const device = new BACnetDevice({
  port: 47808,            // Standard BACnet/IP port
  interface: '0.0.0.0',   // Listen on all interfaces
  broadcastAddress: '255.255.255.255',
  instance: 1234,         // Must be unique on the network (0-4194303)
  name: 'My BACnet Device',
  description: 'some description',
  vendorId: 42,           // Replace with your assigned vendor ID
  vendorName: 'My Company',
  modelName: 'Model XYZ',
  firmwareRevision: '1.0.0',
  applicationSoftwareVersion: '1.0.0',
  apduMaxLength: 1476,
  apduTimeout: 3000,
  apduRetries: 3,
  databaseRevision: 1
});

// Create and add an Analog Input object
const temperatureSensor = device.addObject(new BACnetAnalogInput(1, { 
  name: 'Zone Temperature', 
  unit: EngineeringUnit.DEGREES_CELSIUS,
}));

// Create and add an Analog Output object
const damperControl = device.addObject(new BACnetAnalogOutput(1, {
  name: 'VAV Damper Control',
  unit: EngineeringUnit.PERCENT,
}));

// Listen for BACnet events
device.subscribe('listening', async () => {
  console.log('BACnet device is now online!');
  console.log(`Device Instance: ${device.identifier.instance}`);
  
  // Set the initial value of the temperature input
  temperatureSensor.presentValue.setValue(21.5);
  
  // Set the output value with a specific priority (1-16)
  damperControl.presentValue.setValue(75.0);
  
  // You can also manipulate status flags
  temperatureSensor.statusFlags.setValue(
    new StatusFlagsBitString(StatusFlagsBit.OVERRIDDEN)
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
device.subscribe('error', async (err) => {
  console.error('BACnet error:', err);
});
```

[1]: https://github.com/jacoscaz/bacnet-device
[2]: https://github.com/innovation-system/node-bacnet
[3]: https://jacoscaz.github.io/bacnet-device
[4]: https://github.com/jacoscaz/bacnet-device/blob/main/SUPPORTED_OBJECT_TYPES.md
[5]: https://github.com/jacoscaz/bacnet-device