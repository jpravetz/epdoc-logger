# Logger #

Jim's logger module. Includes support for formatted logging to

- console (default)
- file (specify path)
- [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/) - _SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose._

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
// The setLogger method's first parameter must be 'file','sos' or 'console'
// The second parameter is options with path (for file) and dateFormat of ISO or formatMS (default)
Logger.setLogger( 'file', { path: 'path/to/myfile.log', dateFormat: 'ISO' } );
var loggerType = Logger.getLogger().type;        // One of file, console or sos
Logger.setGlobalLogLevel( 'warn' );
var startTime = Logger.getStartTime();           // Milliseconds

// Instance methods
// The first six of these methods are shortcuts that call the log method

log.info( "I just want to say %s to the %s", "Hello", "World" );
log.debug( "We %s formatted messages", "do" );
log.error( "Error: %s", err );
log.verbose( "The default is to not output verbose messages" );
log.warn( "Danger Will Robinson, danger" );
log.fault( "Restarting server in %d seconds", 10 );

log.date();             // Output now's date/time
log.separator();        // Output a line separator

log.log( 'info', "This method %s supports formatting", "also" );

// Enable verbose messages to be output for this log object (overrides global setting)
log.setLogLevel( "verbose" );
```

## Adding a SessionID to the log output ##

When logging network requests (_.e.g._ http requests) it can be useful to output a unique session ID
with every log message. Logger provides optional support for outputting a session ID. To enable
session ID output you must configure logger and then pass an additional _session object_ to the log methods.
This _session object_ must include a function that returns a session ID as a string.

```
//  Here is a sample object
// Alternatively, you can add a getSessionID function to an existing request object
var req = {
    getSessionId: function() {
        return "SAMPLE_SESSION_ID";
    }
}

// Setup the logger once with the name of the function to call on the object
// You can use any method name, but it must be a function of the object
Logger.setSessionIdCallback( 'getSessionId' );

// Now when you call any of the log instance methods that call the log.log method,
// if the first parameter is an object that has a method 'getSessionId',
// it will add the session ID to the output.
// You cannot pass the req object to the date or separator methods.
log.info( req, "Hello " + Logger.getLogger().type );
// For log.log the req object is the (optional) second parameter
log.log( 'info', req, "Hello " + Logger.getLogger().type );

// Sample output:
// [00:00.010] INFO: [SAMPLE_SESSION_ID] test: Hello console
```

If you have the session ID string you will need to create an object wrapper for the string.
Here is an example of how to do this:

```javascript
function fnSid(inSid) {
    return {
        sid: inSid,
        getSessionId: function() {
            return this.sid;
        }
    };
};

var sid = "012345";
log.info( fnSid(sid), "The sid will appear in the log output" );
```

The log-based methods (log.info, log.error) will also except null or undefined as a first parameter.
This can be used when the session ID object may or may not be available. If the session ID is unknown,
make the object null rather then the session ID.