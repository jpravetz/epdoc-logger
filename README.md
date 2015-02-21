# Logger #

Logging module. Includes support for formatted logging to

* console (default)
* file (specify path) - logs as a JSON array
* [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/) - _SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose._

Also includes optional express middleware logging-related methods.

On startup the logger is set to the console transport.
If a file or SOS logger is closed logging will revert to the previously specified logger.
Thus if you specify an SOS logger and the SOS application is closed, logging will return back to the console.

See the files in the examples folder for additional information.

## Setting the Logger Transport ##

Normally you need only set the logger transport as follows.

```javascript
var Logger = require('logger');
Logger.setLogger( 'file', { path: 'path/to/myfile.log' } );
```

Transports are actually maintained in a stack. When calling ```setLogger``` you are shifting a transport onto
the head of the stack. When you call ```unsetLogger``` you are unshifting the transport and restoring the 
previously set transport. The stack begins it's life with a console transport already in place on the stack.
If a transport closes (_e.g._ SOS Max application exits) the stack is
automatically unshifted. Logger buffers messages while switching transports, however individual
transports can do their own buffering (_e.g._ file). If a transport closes prematurely, it's buffer
may be lost.

There are probably few instances where you would need to manually call ```unsetLogger``` or deal with the stack.

The ```setLogger(type,options)``` has the following parameters:

 * ```type``` - The transport type, which is either a string (one of the built-in transports 'console', 'file' or
 'sos') or the class of a custom transport.
 * ```options``` - An object with the following optional parameters
    * ```path``` - 'path/to/myfile.log', used when type is file
    * ```dateFormat``` - one of 'ISO' or 'formatMS', default is dependent on the transport but is usually 'formatMS'
    * ```bIncludeSessionId``` - Indicates whether the sessionId should be included in the output, defaults to true

To build your own custom transport class it
is recommended that you subclass the console transport (obtained using ```Logger.getLoggerClass('console')```)
and modify as has been done for the file and sos transports.


### Logging to Console ###

```javascript
var Logger = require('logger');
var log = Logger.get('MyModule');

log.info("Return value for %s is %s", "hello", "world" );
log.data('req',{a:3}).info();
log.data('res',{b:4}).info("My message with %s support", 'formatting');
```

### Logging to a File ###

```javascript
var Logger = require('logger');
var log = Logger.get('MyModule');
Logger.setLogger( 'file', { path: 'path/to/myfile.log' } );

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

1. Directly calling the Logger's ```logMessage``` function
2. Using ```Logger.get()``` to create a logging object and calling methods on that object (as shown in above examples)
3. By creating your own logging object that exposes it's own methods, then use this object to call ```logMethod```

If you are creating your own logging object, use Logger's logging object as an example. You can also find
an example in the middleware modules that extend the express.js response object
with logging methods.

### The logMessage Function ##

The ```logMessage``` function directly adds a log message to the log message queue.
This function is used by the _Logging Object_ (next section) and by any
custom logging objects that you may choose to create.

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

The ```logMessage``` function takes an object with the following parameters:

 * ```level``` - Must be one of LEVEL_ORDER values, all lower case
 * ```sid``` - (Optional) sessionID to display
 * ```module``` - (Optional) Module descriptor to display (usually of form route.obj.function)
 * ```action``` - (Optional) Action (verb) descriptor to display (eg. 'org.update')
 * ```time``` - (Optional) A date object with the current time, will be filled in if not provided
 * ```timeDiff``` - (Optional) The difference in milliseconds between 'time' and when the application was
started, based on reading Logger.getStartTime()
 * ```message``` - A string or an array of strings. If an array the string will be printed on multiple lines
where supported (e.g. SOS). The string must already formatted (e.g.. no '%s')
 * ```data``` - Any object, will be serialized as JSON


### Logging using Logger's Logging Object ###

A logging object is obtained by calling ```get``` on the logger.

```javascript
var log = require('logger').get('MyModuleName');
```

The string "MyModuleName" above should usually be set to the name of your Javascript file.
It is output on each line that is created by calling methods on the log object.

This object provides a convenient interface above the ```logMessage``` function with a number of
useful, chainable logging methods, such as ```info```, ```data```, ```action```, etc.

```javascript
// Each of these lines outputs a new log message
log.info("Return value for %s is %s", "hello", "world" );

log.log('info',["A multi-line","output",["With formatted %drd line",%d]]);

// Output a message and a JSON-encoded object
log.data('key2',{type:'value2'}).info("My message");

// Output two objects with no accompanying message
log.data('key1',{type:'value1'}).data('key2',{type:'value2'}).debug();

```

The logging object support chaining. Every method except ```isAboveLevel()``` will return the logging object.

Items added with the ```data``` method are flushed when ```logArgs``` is called.
```logArgs``` is called directly or by any of the methods ```info```, ```debug```, ```log```, etc.

## Logging Commands ##

This sections shows example uses of the log object.

```javascript
// Get the global logger object

var Logger = require('logger');

// Logger static methods

Logger.setLogger( 'file', { path: 'path/to/myfile.log', dateFormat: 'ISO', bIncludeSid: false } );
var loggerType = Logger.getCurrentLogger().type();        // Will return the transport type of the logger
Logger.setGlobalLogLevel( 'warn' );
var startTime = Logger.getStartTime();                    // Milliseconds

// Get a log object for this file or module

var log = Logger.get('MyModuleName');

// Instance methods. Each line outputs a message.

log.logObj('a',1).logObj('b',[2,3]).info();
log.logObj({a:1,b:[2,3]}).info("My message");
log.info( "I just want to say %s to the %s", "Hello", "World" );
log.action('obj.update').debug( "We %s formatted messages", "do" );
log.error( "Error: %s", err );
log.verbose( "The default is to not output verbose messages, so this will not by default be output" );
log.warn( "Danger Will Robinson, danger" );
log.fault( "Restarting server in %d seconds", 10 );

// Outputs a new message
log.date();             // Output now's date/time
log.separator();        // Output a line separator

log.log( 'info', "This method %s supports formatting", "also" );

// Enable verbose messages to be output for this log object (overrides global setting)
log.setLogLevel( "verbose" );
```

### Chaining ###

The following methods all add column values to the message that is output but do not output the message:

* ```action``` - Sets the action column value to this string.
* ```logObj``` - Sets the data column value. Either pass in a key value pair, which is then added to the data
object, or an object, which the data object is then set to.

The following methods result in a message being output with the corresponding log level set:

* ```info```
* ```warn```
* ```debug```
* ```verbose```
* ```error```
* ```fatal```

The following methods result in a message output with log level set to INFO:

* ```separator``` - Output a separator line containing # characters
* ```date``` - Outputs localtime, utctime and uptime
* ```log``` - Outputs level and string message, for example: ```log.log( 'info', "Found %d lines", iLines )```.
    * ```level``` - Optional level (defaults to ```info```)
    * ```msg``` - String to output, formatted with ```util.format```



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

See examples/reqtest.js for an example of how to use a stub request and response method to test middleware.
This technique can also be useful if you wish to use the req/res/next mechanism in non-express environments.
As an example, you could have req/res objects for tracking AMQP (RabbitMQ) requests and responses and
associating reqIds with the AMQP requests.

### reqId ###

Adds ```_reqId``` and ```_hrStartTime``` to the request object. These are used later when logging.

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
