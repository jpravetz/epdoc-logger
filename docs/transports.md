## Transports

A transport is a destination for log messages. There is built-in support for the
following transport types. 

* `Console` - logs to the console (default)
* `Buffer` - A line buffer/callback transport useful for automated testing
* `File` - logs to a file
* `Loggly` - Logs to the online [loggly.com](http://loggly.com) service.
* ~~`SOS` - Logs to SOS~~. The SOS project no longer exists.

Log messages will be output to all transports that are activated by the log
manager, meaning that the same log message can go to multiple transports at the
same time.

By default log messages are written to the console. If you only need to write
messages to the console, you may use it's default configuration, or skip to the
[section on configuring the console transport](#configuration-console-output).

### Configuration

Transports are configured when they are added to the [Log Manager](./classes.md#logmgr-class).

```typescript
import ? from '@epdoc/logger'

const consoleConfig : ConsoleTransportOptions = {
  type: 'console',
  show: {
    timestamp: 'local'
  },
  levelThreshold: 'verbose'
};

const logMgr = new LogMgr();
logMgr.addTransport(consoleConfig);
logMgr.start();

// or

const logMgr = new LogMgr().addTransport(consoleConfig).start();

```

On startup the logger can wait for a transport to be initialized before starting
to write log messages, or will begin writing log messages immediately when
{@link LogManager#autoRun} is set to true. By default the logger uses the
Console Transport and must be started manually using the start method.

Call the LogManager start method after all transports are added and to begin logging.  You can write messages to the logger before this call, but they will be buffered until the transports are ready.

Transports are configured via properties passed to LogManager's
[addTransport](./src/log-manager.ts#L100) method. Transport configuration
properties are passed directly to the transport. Refer to the individual
transport API reference documents for more information. 

## Common Configuration

Transport options include the following, which shows the default values:

```typescript
const defaultTransportOptions: TransportOptions = {
  type: 'console',
  format: {
    type: 'string',
    tabSize: 2,
    colorize: true
  },
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: true,
    action: true,
    data: true
  },
  separator: {
    char: '#',
    length: 80
  },
  levelThreshold: 'info',
  errorStackThreshold: 'error',
};
```

### Configuration Console Output

Main File

```typescript 
let gLogMgr = require('epdoc-logger').getLogManager().start();
let log = gLogMgr.getLogger('main');

log.info("Return value for %s is %s", "hello", "world" );
log.data('req',{a:3}).info();
log.data('res',{b:4}).info("My message with %s support", 'formatting');
```

Other js files

```typescript 
let log = require('epdoc-logger').getLogger('other');

log.info("Hello world");
```

Console and File transport output is in one of the following formats:
- jsonArray (default) - An array of JSON values (see example below)
- json - A JSON object with key/value pairs for the output
- function - Provide your own function to format the output
- template - Template-based output with optional colorization (colorization on Console only)

These formats are specified as options when constructing the transport. 
Refer to the transport documentation for more details.

JSON array format looks like this 

```
["00:00.000","INFO","logger","logger.transport.add","Added transport 'Console'",{"transport":"Console"}]
```

and has array entries for [ ts (timestamp), level, reqId, sid, emitter, action, message, static, data ]. 
The reqId and sid fields are only output if the transport `sid` option is true.
The static field is only output if the transport `static` option is true.

The example below shows a console configuration for custom colorized output.
In this example `$c` specifies that `level` and `message` be colorized.
The `level` field will also be right padded to a minimum width of 5 characters.
Numbers and strings can be left padded by adding a `0` as in `$05{reqId}`.


```typescript
let econfig = {
    transports: [ 'console' ],
    console: {
        format: 'template',
        colorize: true,
        template: '${ts} $c5{level} ${action}/${emitter} $c{message}'
    }
};
```


### Logging to a File ###

This shows the more hands-on use of the Logger object to set transports.

```typescript
let gLogMgr = require('epdoc-logger').getLogManager();
gLogMgr.setTransport( 'file', { path: 'path/to/myfile.log' } );

let log = gLogMgr.getLogger('MyModule');

log.info("Return value for %s is %s", "hello", "world" );
log.data('req',{a:3}).info();
log.data('res',{b:4}).info("My message with %s support", 'formatting');
```


### Logging to SOS ###

The SOS application appears to no longer be availble.

When you set the logger to SOS the setLogger method returns immediately, but the socket takes awhile to
initialize. In the meantime log messages are queued up and getLogger() returns the SOS logger. Once the
connection is made the messages are flushed. If the connection is refused the messages are flushed to the
previously set logger output (usually the console).

```typescript
let logMgr = require('epdoc-logger').getLogManager({autoRun:false});
logMgr.setTransport( { type: 'sos', bIncludeSessionId: false } );

let log = logMgr.getLogger('MyModule');

log.info("Return value for %s is %s", "hello", "world" );
```

### Logging to Loggly ###

Loggly output is buffered and sent in batches. As a result it is important to shutdown logging before exiting.
See the example earlier in this readme showing how the destroying method is used to get this done.

### Logging to Callback ###

The Callback transport can be used in unit tests. By listening for your log messages, you can 
test whether your code is progressing correctly.

### Closing Transports

Transports can be closed using {@link LogManager#removeTransport}, or can sometimes close on their own.
The Logger will buffer messages while switching transports,
however individual transports can do their own buffering (_e.g._ file and loggly).
If a transport closes prematurely, it's buffer may be lost.

## Logging Example ##

```typescript
// Get the global logger object

let logMgr = require('../index').getLogManager({sid:false});

// Logger static methods

logMgr.addTransport( 'file', { path: 'path/to/myfile.log', dateFormat: 'ISO', sid: false } );
let loggerType = logMgr.getTransports()[0].type();
logMgr.setLevel( 'warn' );
let startTime = logMgr.getStartTime();                    // Milliseconds

// Get a Logger object for this file or module

let log = logMgr.start().getLogger('MyClassName');

// Instance methods. Each line outputs a message.

log.data('a',1).data('b',[2,3]).info();
log.data({a:1,b:[2,3]}).info("My message");
log.info( "I just want to say %s to the %s", "Hello", "World" );
log.action('obj.update').debug( "We %s formatted messages", "do" );
log.error( new Error("My error") );
log.verbose( "The default is to not output verbose messages, so this will not by default be output" );
log.warn( "Danger Will Robinson, danger" );
log.fatal( "Restarting server in %d seconds", 10 );

// Outputs a new message
log.date();             // Output now's date/time
log.separator();        // Output a line separator

log.log( 'info', "This method %s supports util.format style formating", "also" );

// Enable verbose messages to be output for this log object (overrides global setting)
log.setLevel( "verbose" );

```
