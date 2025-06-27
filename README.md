
# @bacnet-js/device

A TypeScript library for implementing BACnet/IP devices in Node.js.

## Status

Under heavy development as of June 2025.

This project was started by [Jacopo Scazzosi] ([@jacoscaz]), who continues
to maintain it, halfway through 2025. However, just a few weeks after the first
alpha release, it was then moved to the newly-created [bacnet-js] organization,
together with primary dependency [node-bacnet]. By putting our heads together
we hope to create a robust, modular, cohesive ecosystem for BACnet applications
in Node.js.

Interested in the intersection of BACnet and Node.js? [Come visit us][bacnet-js]!

## Characteristics

This library provides a high-level API that simplifies the instantiation and
management of BACnet objects by abstracting network operations (subscription
management, CoV propagation, value updates) and accurately modelling BACnet's
object types through dedicated classes that automatically instantiate all
properties required by the BACnet specification.

1. **Detailed types**: ships well-defined interfaces and classes to surface
   BACnet's complex data structures at the typings level.
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

This library is built on top of the wonderful [node-bacnet], a TypeScript
implementation of BACnet's protocol. Any improvement that is applicable to 
[node-bacnet] is contributed upstream.

## Documentation

- Source code: [https://github.com/bacnet-js/device][device]
- API documentation: [https://bacnet-js.github.io/device][apidocs].
- Conformance: see the [CONFORMANCE.md] file.

## License

This project is licensed under the MIT License - see the [LICENSE] file
for details.

## Usage

- [Initializing a device](#initializing-a-device)
- [Adding an object to a device](#adding-an-object-to-a-device)
- [Changing property values](#changing-property-values)
- [Extending object classes](#extending-object-classes)

### Initializing a device

```typescript
import { BDDevice } from 'bacnet-device';

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

// Listen for errors
device.on('error', (err) => {
  console.error('BACnet error:', err);
});
```

### Adding an object to a device

```typescript
import { BDAnalogValue } from 'bacnet-device';
import { EngineeringUnits } from '@innovation-system/node-bacnet';

const analogValueObj = device.addObject(new BDAnalogValue(1, { 
  name: 'Zone Temperature', 
  unit: EngineeringUnits.DEGREES_CELSIUS,
}));
```

### Changing property values

```typescript 
await analogValueObj.presentValue.setValue(25.6);
```

This will result in CoV events being sent to active subscriber, if present.

### Extending object classes

Have a look at the source code for object classes implementing the simpler
BACnet object types and use the same pattern in your code:

- [`BDAnalogValue`](https://github.com/bacnet-js/device/blob/main/src/objects/analogvalue.ts)
- [`BDIntegerValue`](https://github.com/bacnet-js/device/blob/main/src/objects/integervalue.ts)


[device]: https://github.com/bacnet-js/device
[apidocs]: https://bacnet-js.github.io/device
[bacnet-js]: https://github.com/bacnet-js
[Jacopo Scazzosi]: https://github.com/jacoscaz
[@jacoscaz]: https://github.com/jacoscaz
[node-bacnet]: https://github.com/bacnet-js/node-bacnet
[LICENSE]: https://github.com/bacnet-js/device/blob/main/LICENSE
[CONFORMANCE.md]: https://github.com/bacnet-js/device/blob/main/CONFORMANCE.md
