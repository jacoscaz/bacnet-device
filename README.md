
# `bacnet-device`

A TypeScript library for implementing BACnet IP devices in Node.js.

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

This library provides a high-level, type-safe API built on top of
[`@innovation-system/node-bacnet`][2].

## Documentation

API documentation is available at [https://jacoscaz.github.io/bacnet-device][3].

## Example usage

```typescript
import { 
  BACnetNode, 
  BACnetDevice,
  BACnetAnalogInput,
  BACnetAnalogOutput,
  EngineeringUnit,
  DeviceStatus,
  ObjectType,
  PropertyIdentifier,
  StatusFlagsBit,
  StatusFlagsBitString
} from 'bacnet-device';

// Create a BACnet node (network interface)
const node = new BACnetNode({
  port: 47808,           // Standard BACnet/IP port
  interface: '0.0.0.0',  // Listen on all interfaces
  broadcastAddress: '255.255.255.255',
  apduTimeout: 3000,
});

// Initialize a BACnet device
const device = new BACnetDevice({
  instance: 1234,         // Must be unique on the network (0-4194303)
  name: 'My BACnet Device',
  vendorId: 42,           // Replace with your assigned vendor ID
  vendorName: 'My Company',
  modelName: 'Model XYZ',
  firmwareRevision: '1.0.0',
  applicationSoftwareVersion: '1.0.0',
  apduLength: 1476,
  apduTimeout: 3000,
  apduRetries: 3,
  databaseRevision: 1
});

// Add device to the node
node.addDevice(device);

// Create and add an Analog Input object
const temperatureSensor = device.addObject(
  new BACnetAnalogInput(1, 'Zone Temperature', EngineeringUnit.DEGREES_CELSIUS)
);

// Create and add an Analog Output object
const damperControl = device.addObject(
  new BACnetAnalogOutput(1, 'VAV Damper Control', EngineeringUnit.PERCENT)
);

// Listen for BACnet events
node.on('listening', () => {
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
node.on('error', (err) => {
  console.error('BACnet error:', err);
});
```

[1]: https://github.com/jacoscaz/bacnet-device
[2]: https://github.com/innovation-system/node-bacnet
[3]: https://jacoscaz.github.io/bacnet-device
