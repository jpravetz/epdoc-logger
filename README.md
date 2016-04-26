# Logger #

Logging module supporting built-in and custom transports, Express 4 response mixins, and chainable method syntax for creating log events.

Version 2 is currently [under development in the develop branch](https://github.com/jpravetz/epdoc-logger/tree/develop). 
It is recommended you use the alpha of version 2 rather than using 1.9.x.

Includes support for formatted logging to the following transports:

* console (default)
* file (specify path) - logs as a JSON array
* [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/) - _SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose._

On startup the logger is set to the console transport, but the console transport is not yet activated.
All log messages are queued until you start the current transport or set a different transport.
Once you start the current transport with ```startLogger``` the console will begin to output log messages.
Instead you can set a different transport using ```setLogger``` and then logging, including queued log messages,
will begin being output to the new transport.

If a transport is closed using ```unsetLogger``` logging will revert to the previously specified transport.
For example, if you specify an SOS transport and the SOS application is closed, logging will return back to the console
and the console will be (re)started automatically.

See the files in the test folder for additional examples and information.

## Logger Transports ##

### Starting the Default Console Transport ###

The default console transport is not activated until it is started.

```javascript
var Logger = require('logger');
Logger.startLogger();
```

Once started, any queued messages will begin being output.


### Setting the Logger Transport ###

Alternate transports can be set as follows.

```javascript
var Logger = require('logger');
Logger.setLogger( 'file', { path: 'path/to/myfile.log' } );
```

The call to ```setLogger``` will stop the previously activated transport (if any),
add the new transport to the stack and automatically start the new transport.

Transports are maintained in a list. When calling ```setLogger``` you are unshifting a transport onto
the head of the list. When you call ```unsetLogger``` you are stopping the transport, shifting it off the list
of transports, and restoring and restarting the previously set transport.

If an active transport closes (_e.g._ SOS Max application exits) the active transport is automatically shifted
off the list of transports as if calling ```unsetLogger```. The Logger will buffer messages while switching transports,
however individual transports can do their own buffering (_e.g._ file).
If a transport closes prematurely, it's buffer may be lost.

There are probably few instances where you would need to manually call ```unsetLogger``` or deal with the list
of transports, except where wishing to start and stop an _SOS_-style transport.

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
Logger.startLogger();
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

Now that we've seen how to specify a transport, and have been shown example code that logs messages, let's look
at the various ways that log messages can be created.

Logging is done by one of these methods:

1. Directly calling the Logger's ```logMessage``` function
2. Using ```Logger.get()``` to create a logging object and calling methods on that object (as shown in above examples)
3. By creating your own logging object that exposes it's own methods, then use this object to call ```logMessage```

If you are creating your own logging object, use Logger's logging object as an example. You can also look
at ```middleware/responseLogger.js``` for an example of a module that extends the express.js response object
with logging methods.

### The logMessage Function ##

The ```logMessage``` function directly adds a log message object to the log message queue.
The ```logMessage``` function is used by the _Logging Object_ (next section) and by any
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

Messages are flushed from the queue whenever the transport indicates it is ready for more messages. Messages
are then passed to the transport by calling the transport's ```write``` method and passing the log message object
as a method parameter. The transport then formats and outputs the data. You can layer your own logging library underneath
epdoc-logger by wrapping your library as a transport.

### Logging using Logger's Logging Object ###

A new logging object is obtained by calling ```get``` on the logger.

```javascript
// Return new logging object with property ```moduleName``` set.
var log = require('logger').get('MyModuleName');
```

The string "MyModuleName" above should usually be set to the name of your Javascript file or module.
It is output as a column or property of each line that is created by calling methods on the log object.

The logging object provides a convenient interface that sits above the ```logMessage``` function and adds a number of
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

The logging object supports chaining. Every method except ```isAboveLevel()``` will return the logging object.

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

See test/reqtest.js for an example of how to use a stub request and response method to test middleware.
This technique can also be useful if you wish to use the req/res/next mechanism in non-express environments.
As an example, you could have req/res objects for tracking AMQP (RabbitMQ) requests and responses and
associating reqIds with the AMQP requests.

### reqId ###

Adds ```_reqId``` and ```_hrStartTime``` to the request object. These are used later when logging.

### responseLogger ###

The responseLogger middleware mixes custom logging methods, similar to those in the logging object,
into the express ```response``` object. This will add request-context-sensitive logging information
to each log message.

As with the logging object, most methods can be chained. An example usage:

```javascript
function myFunction(req,res,params) {
    res.pushRouteInfo('myFunction');
    res.action('complete').logObj(params).info('Entering function');
    res.popRouteInfo();
}
```

It would be nice if there were more documentation for the logging methods, but in the meantime,
please refer to the source code in responseLogger.js.

### routeSeparator ###

Adds a separator line to the log file for each new route.

### routeLogger ###

Adds an information line to the log file for each new route.
