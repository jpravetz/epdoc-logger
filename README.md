# Logger #

Jim's logger module. Includes support for formatted logging to

- console (default)
- file (specify path)
- [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/)

_"The SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose."_

On startup the logger is set to console.
If a file or SOS logger is closed logging will revert to the previously specified logger.
Thus if you specify an SOS logger and the SOS application is closed, logging will return back to the console.

## Logging to Console ##

You create a new logging object using the ```get``` method.

```javascript
var log = require('logger').get('MyModule');

log.info("Return value for %s is %s", "hello", "world" );

log.log('info',["A multiline","output"]);
```

The string "MyModule" above should usually be set to the name of your Javascript file, and will be output
along with the log level.


## Logging to a File ##

```javascript
var Logger = require('logger');
var log = Logger.get('MyModule');
Logger.setLogger( 'file', { path: 'path/to/myfile.log' } );

log.info("Return value for %s is %s", "hello", "world" );
```

## Logging to SOS ##

When you set the logger to SOS the setLogger method returns immediately, but the socket takes awhile to
initialize. In the meantime log messages are queued up and getLogger() returns the SOS logger. Once the
connection is made the messages are flushed. If the connection is refused the messages are flushed to the
previously set logger output (usually the console).

```javascript
var Logger = require('logger');
var log = Logger.get('MyModule');
Logger.setLogger( 'sos' );

log.info("Return value for %s is %s", "hello", "world" );
```

## Logging Commands ##

```javascript

var Logger = require('logger');

// Static methods

var log = Logger.get('MyModuleName');
Logger.setLogger( 'file', { path: 'path/to/myfile.log' } );
var loggerType = Logger.getLogger().type;        // One of file, console or sos
Logger.setGlobalLogLevel( 'warn' );
var startTime = Logger.getStartTime();           // Milliseconds


// Instance methods

log.info( "I just want to say %s to the %s", "Hello", "World" );
log.debug( "We %s formatted messages", "do" );
log.error( "Error: %s", err );
log.verbose( "We don't see verbose message by default" );
log.warn( "Danger Will Robinson, danger" );
log.date();             // Output now's date/time
log.separator();        // Output a line separator

log.log( 'info', "A message that " + "is not formatted" );

// Enable verbose messages to be output for this log object (overrides global setting)
log.setLogLevel( "verbose" );
```
