# Logger #

Jim's Logger module. Includes support for formatted logging to

* console (default)
* file (specify path) - logs as a JSON array
* [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/) - _SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose._

Also includes optional express middleware logging-related methods.

On startup the logger is set to the console transport.
If a file or SOS logger is closed logging will revert to the previously specified logger.
Thus if you specify an SOS logger and the SOS application is closed, logging will return back to the console.

## Setting the Logger Transport ##

Transports are maintained in a stack. You push a transport using ```setLogger``` and pop a transport
using ```popLogger```. If a transport closes (_e.g._ SOS Max is closed) the stack is
automatically popped. Logger buffers messages while switching transports, however individual
transports can do their own buffering (_e.g._ file). If a transport closes prematurely, it's buffer
may be lost.

There are probably few where you would need to manually call ```popLogger```.

The ```setLogger``` method takes an object with these properties:

 * type - Must be one of 'console', 'file' or 'sos'
 * path - 'path/to/myfile.log', used when type is file
 * dateFormat - one of 'ISO' or 'formatMS', default is dependent on the transport but is usually 'formatMS'
 * bIncludeSessionId - Indicates whether the sessionId should be included in the output, defaults to true

### Logging to a File ###

```javascript
var Logger = require('logger');
var log = Logger.get('MyModule');
Logger.setLogger( { type: 'file', path: 'path/to/myfile.log' } );

log.info("Return value for %s is %s", "hello", "world" );
log.data('req',{a:3}).info();
log.data('res',{b:4}).info("My message with %s support", 'formatting');
```

Log output to a file is a JSON-formatted array with [ date, level, sid, module, message, data ], as defined
under the LogMessage function (below).

### Logging to SOS ###

When you set the logger to SOS the setLogger method returns immediately, but the socket takes awhile to
initialize. In the meantime log messages are queued up and getLogger() returns the SOS logger. Once the
connection is made the messages are flushed. If the connection is refused the messages are flushed to the
previously set logger output (usually the console).

```javascript
var Logger = require('logger');
var log = Logger.get('MyModule');
Logger.setLogger( { type: 'sos', bIncludeSessionId: false } );

log.info("Return value for %s is %s", "hello", "world" );
```

## How to Log Messages ##

Logging is done by one of these methods:

1. Directly calling the Logger's logMessage function
2. Using Logger.get() to create a logging object and calling methods on that object (as shown in above examples)
3. Creating your own logging object that exposes it's own methods, then use this object to call logMethod

If you are creating your own logging object, use Logger's logging object as an example. You can also find
an example in the Armor5 Admin Console where a middleware module extends the express.js response object
with logging methods.

### The logMessage Function ##

The logMessage function gives you a direct API into the queue of logging messages that are to be output.
This function is used by the Logging Object (next section) and by your custom logging objects.

```javascript
var Logger = require('logger');
Logger.setLogger( { type: 'sos', bIncludeSessionId: true } );
Logger.setGlobalLogLevel( 'info' );
Logger.logMessage( {
        level: 'info',
        sid: '123',
        module: 'api.org.create',
        message: "My formatted message"
        });
```

The logMessage function takes an object with the following parameters:

 * level - Must be one of LEVEL_ORDER values, all lower case
 * sid - (Optional) sessionID to display
 * module - (Optional) Module descriptor to display (usually of form route.obj.function)
 * action - (Optional) Action (verb) descriptor to display (eg. 'org.update')
 * time - (Optional) A date object with the current time, will be filled in if not provided
 * timeDiff - (Optional) The difference in milliseconds between 'time' and when the application was
started, based on reading Logger.getStartTime()
 * message - A string or an array of strings. If an array the string will be printed on multiple lines
where supported (e.g. SOS). The string must already formatted (e.g.. no '%s')
* data - Any object, will be serialized as JSON


### Logging using Logger's Logging Object ###

The logger module includes a handy logging object that you can initialize in a file for logging from that file.

You create a new logging object using the Logger's ```get``` method.

```javascript
var log = require('logger').get('MyModuleName');

log.info("Return value for %s is %s", "hello", "world" );

log.log('info',["A multiline","output",["With formatted %drd line",%d]]);

// Output a message and a JSON-encoded object
log.data('key2',{type:'value2'}).info("My message");

// Output two objects with no accompanying message
log.data('key1',{type:'value1'}).data('key2',{type:'value2'}).debug();

```

The string "MyModuleName" above should usually be set to the name of your Javascript file, and will be output
along with the log level.

The logging object support chaining. Every method except isAboveLevel() will return the logging object.

Items added with the data() method are flushed when logArgs is called.
logArgs is called for any of the methods info(), debug(), log(), etc.

## Logging Commands ##

```javascript

var Logger = require('logger');

// Static methods

var log = Logger.get('MyModuleName');
Logger.setLogger( { type: 'file', path: 'path/to/myfile.log', dateFormat: 'ISO', bIncludeSid: false } );
var loggerType = Logger.getLogger().type;        // One of file, console or sos
Logger.setGlobalLogLevel( 'warn' );
var startTime = Logger.getStartTime();           // Milliseconds

// Instance methods
// The first six of these methods are shortcuts that call the log method

log.action('obj.update');
log.action('obj','update');
log.action(['obj','update']);
log.logObj('a',1).logObj('b',[2,3]).info();
log.logObj({a:1,b:[2,3]}).info("My message");
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

## Express Middleware ##

The included express middleware are instantiated as follows:

```javascript
var Logger = require('logger');

var reqId = Logger.middleware().reqId;
var responseLogger = Logger.middleware().responseLogger;
var routeLogger = Logger.middleware().routeLogger;
var routeSeparator = Logger.middleware().routeSeparator;

var app = express();
app.use(reqId());

app.use(app.router);
app.all('*', responseLogger());
app.all('*', routeSeparator());
app.all('*', routeLogger());
```

### reqId ###

Adds ```_reqId``` and ```_hrStartTime``` to the request object. These are used later during logging.

### responseLogger ###

Adds a set of methods to the response object to enable easier request-context-sensitive logging.
Most methods can be chained. An example usage:

```javascript
function myFunction(req,res,params) {
    res.pushRouteInfo('myFunction');
    res.action('complete').logObj(params).info('Entering function');
    res.popRouteInfo();
}
```

### routeSeparator ###

Adds a separator line to the log file for each new route.

### routeLogger ###

Adds an information line to the log file for each new route.
