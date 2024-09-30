## Classes

There are two main objects you will use when logging messages:
 
- [LogManager](#logmanager-class)
  - Usually a singleton
  - Used to configure the transports, set global options, buffer log messages until writing to transports is turned on, and start writing to the transports
  - Can also be used to directly write to the transports (see {@link LogManager#logMessage})
- [Logger](#logger-class)
  - A per-emitter object
  - Advise is to create a new Logger object for every file (emitter), or for every request (_e.g._ express), or every major operation, or just create one logger and use it throughout your code.
  - Provides chainable methods by which to write log output
 
```typescript
import { LogManager } from '@epdoc/logger';

let logMgr = new LogManager();
let log = logMgr.getLogger('MyClassName');
```

### LogMgr Class

A shortcut for getting a {@link LogManager} singleton is to call the module's `getLogManager` method.

```typescript
import { LogManager } from '@epdoc/logger';

let logMgr = new LogManager();
```

An alternative is to manage your own {@link LogManager} object:

```typescript
let epdocLogger = require('epdoc-logger');
let LogManager = epdocLogger.LogManager;
let logMgr = new LogManager();
```

Because you may need to load config information before configuring your transport you must 
explicitly start logging by calling {@link LogManager#start}. And, because some 
log tranports are buffered, you should also call {@link LogManager#flushing} or 
{@link LogManager#destroying} before shutting down.

### Logger Class

{@link Logger} objects are created by calling {@link LogManager#getLogger} or ```new Logger()```. 
Typically you would create a new Logger object for
every javascript file and set a unique _emitter_ name for that Logger. 
Alternatively, when responding to requests, for example when using [Express](http://expressjs.com),
it is a better idea to tie the emitter to the request. This is described later in this document.

Loggers are created by calling [getLogger](./src/log-manager.ts#L188).

```typescript
let log = logMgr.getLogger('emitter-name');

// This is equivalent
let log = new Logger(logMgr,'emitter-name');

// A shortcut that is also equivalent and that uses a global LogManager object
let log = require('epdoc-logger').getLogger('emitter-name');
```


### MsgBuilder Class

### Other Classes

- [LogLevels](./log-levels.md)
- [LoggerTransport](./transports.md)
