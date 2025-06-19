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
device.subscribe('listening', async () => {
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
device.subscribe('error', async (err) => {
  console.error('BACnet error:', err);
});