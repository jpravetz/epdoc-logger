# Logger #

A logging module supporting built-in and custom transports, Express 4 response mixins, 
rich message and data syntax, and chainable methods for creating log events.
Generally follows [Winston's](https://github.com/winstonjs/winston) logging method calls
for simpler messages, but with the addition of chainable calls to set other output columns.

**Note: express middleware is not yet working in this alpha version.**

## Install

Install

```bash
npm install --save epdoc-logger
```

## Quick Start

Log to the console.

```javascript
var log = require('epdoc-logger').start().get();

log.info("Hello world");
log.log('debug',"Hello %s","world");
```

Log to a file, and buffer any messages until the logger is set up

```javascript
var logMgr = require('epdoc-logger').logMgr();
var log = logMgr.get('main');
log.info("Starting application");

var config = require('config.json');
logger.setTransport('file',{path:config.logFile}); 

log.info("Hello world");
```

Log to loggly, buffering and making batch calls to loggly.

```javascript
var logger = require('epdoc-logger').logger({autoRun:false);
var log = logger.get('main');
log.info("Starting application");

logger.setTransport('loggly',{token:'MyToken'}); 

log.info("Hello world");

// log a message count for all the different log levels
logger.writeCount();

// Shutdown properly so loggly message buffer is flushed
logger.destroying().then(function() {
    done();
}, function(err) {
    done(err);
});

```


In the above we are using two different objects:
 
* ```logger``` - The main logger, usually a singleton, where the transport is configured
* ```log``` - A per-javascript-file object upon which the actual logging methods are attached. 
This is obtained by calling ```logger.get(moduleName)``` and is used to log the filename along with the log message.

## Configuring Transports

The module has built-in support for the following transports:

* console (default)
* file (specify path) - logs as a JSON array
* [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/) - _SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose._
* line - A line buffer used for automatic testing
* loggly - See [loggly.com](http://loggly.com).

On startup the logger can wait for a transport to be initialized before logging, or it can being writing log messages
immediately. By default the logger auto-starts and uses the Console Transport.

A call to ```setTransport``` call ```start``` to begin logging. 
Successfully setting the transport will also start writing log messages. Messages are buffered prior to the
transport being intitialized, so prior to this event no messages will be lost.

### Logging to Console ###

Main File

```javascript 
var gLogMgr = require('epdoc-logger').logMgr(a).start();
var log = gLogMgr.get('main');

log.info("Return value for %s is %s", "hello", "world" );
log.data('req',{a:3}).info();
log.data('res',{b:4}).info("My message with %s support", 'formatting');
```

Other File

```javascript 
var log = require('epdoc-logger').get('other');

log.info("Hello world");
```

### Logging to a File ###

This shows the more general use of the logger object.

```javascript
var gLogMgr = require('epdoc-logger').logger();
var log = gLogMgr.get('MyModule');
logger.setTransport( 'file', { path: 'path/to/myfile.log' } );

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
var logger = require('epdoc-logger').logger({autoRun:false});
var log = Logger.get('MyModule');
logger.setTransport( { type: 'sos', bIncludeSessionId: false } );

log.info("Return value for %s is %s", "hello", "world" );
```

### Logging to Loggly ###

Loggly output is buffered and sent in batches. As a result it is important to shutdown logging before exiting.
See the example earlier in this readme showing how this is done.

### Advanced

Transports can also be closed using ```unsetLogger```. In this event logging will revert to the previously 
specified transport. For example, if you specify an SOS transport and the SOS application is closed, 
logging will return back to the console and the console will be (re)started automatically. 
If an active transport closes on it's own (_e.g._ SOS Max application exits) 
the active transport is automatically shifted off the list of transports as if calling ```unsetLogger```.

See the files in the test folder for additional examples and information.

A call to ```setLogger``` will stop the previously activated transport (if any),
add the new transport to the stack and automatically start the new transport.

Transports are maintained in a list. When calling ```setLogger``` you are unshifting a transport onto
the head of the list. When you call ```unsetLogger``` you are stopping the transport, shifting it off the list
of transports, and restoring and restarting the previously set transport.

The Logger will buffer messages while switching transports,
however individual transports can do their own buffering (_e.g._ file).
If a transport closes prematurely, it's buffer may be lost.

There are probably few instances where you would need to manually call ```unsetLogger``` or deal with the list
of transports, except where wishing to start and stop an _SOS_-style transport.

The ```setLogger(type,options)``` has the following parameters:

 * ```type``` - The transport type, which is either a string (one of the built-in transports 'console', 'file' or
 'sos') or the class of a custom transport.
 * ```options``` - An object with the following optional parameters
    * ```path``` - 'path/to/myfile.log', used when type is ```file```
    * ```dateFormat``` - one of 'ISO' or 'formatMS', default is dependent on the transport but is 
    usually 'formatMS' (not used with loggly)
    * ```bIncludeSid``` - Indicates whether the sessionId should be included in the output, defaults to true

To build your own custom transport class it
just copy or subclass the console transport (obtained using ```Logger.getLoggerClass('console')```)
and modify as has been done for the file and sos transports.

Loggly has these additional options:

- ```token``` (required) Token issued by [loggly.com] for your account
- ```bufferSize``` (optional, default 100 messages) Number of messages to buffer
- ```flushInterval``` (optional, default 5000 ms) An interval timer that flushes messages if there are any


## Log Messages

Logging is done by one of these methods, however the 2nd is the most popular for normal applications,
and it is recommended that you start there.

1. Directly calling the Logger's ```logMessage``` or lower level ```logParams``` functions
2. Using ```logger.get()``` to create a logging object and calling methods on that object 
(as shown in above examples)
3. By creating your own logging object that exposes it's own methods, then use 
this object to call ```logParams```

If you are creating your own logging object, use Logger's logging object as an example. You can also look
at ```middleware/responseLogger.js``` for an example of a module that extends the express.js response object
with logging methods.

### Logging using Logger Object and logMessage method ##

The ```logParams``` function directly adds a log message object to the log message queue.
The ```logParams``` function is used by the _Logging Object_ (next section) and by any
custom logging objects that you may choose to create.

```javascript
var logger = require('epdoc-logger').logger();
logger.setLogger( { type: 'sos', bIncludeSessionId: true } );
logger.setLevel( 'info' );
logger.logParams( {
        level: 'info',
        sid: '123',
        module: 'api.org.create',
        message: "My formatted message"
        });
```

The ```logParams``` function takes an object with the following parameters:

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

### Logging using Log Object ###

A new Module Logging object is obtained by calling ```get``` on the logger. A shortcut is to use 
```require('epdoc-logger').get()``` to obtain the object.

It is recommended that you create a new log object for each module or request. Attach your
log object to a request object when you want to log in the context of the request. In this
situation you should also set ```{ sid: true }``` in your LogManager.

```javascript
// Return new logging object with property ```moduleName``` set.
var log = require('epdoc-logger').get('MyModuleName');
```

The string "MyModuleName" above should usually be set to the name of your Javascript file or module.
It is output as a column or property of each line that is created by calling methods on the log object.

The logging object provides a convenient interface that sits above the ```logParams``` function and 
adds a number of useful, chainable logging methods, such as ```info```, ```data```, ```action```, etc.

```javascript
// Each of these lines outputs a new log message
log.info("Return value for %s is %s", "hello", "world" );

log.log('info',["A multi-line","output",["With formatted %drd line",%d]]);

// Output a message and a JSON-encoded object
log.data('key2',{type:'value2'}).info("My message");

// Output two objects with no accompanying message
log.data('key1',{type:'value1'}).data('key2',{type:'value2'}).debug();
```

The Module Logging object supports chaining. Most methods will return the object.

Items added with the ```data``` method are flushed when ```logArgs``` is called.
```logArgs``` is called directly or by any of the methods ```info```, ```debug```, ```log```, etc.

You can also set per-Log Object _custom_ data using the ```log.set()``` method. 
Data set this way remain constant for the life of the log object. For requests this might be
useful to output something like the _messageId_ of a request. To output custom data you will also
need to set ```{ custom: true }``` in your LogManager

## Logging Commands ##

This sections shows example uses of the LogManagher object.

```javascript
// Get the global logger object

var logMgr = require('epdoc-logger').logMgr({sid:false});

// Logger static methods

logMgr.setTransport( 'file', { path: 'path/to/myfile.log', dateFormat: 'ISO', sid: false } );
var loggerType = logMgr.getCurrentTransport().type();        // Will return the transport type of the logger
logMgr.setLevel( 'warn' );
var startTime = logMgr.getStartTime();                    // Milliseconds

// Get a Logger object for this file or module

var log = logMgr.get('MyModuleName');

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
log.setLevel( "verbose" );
```

### Chaining ###

These methods on the Module Logging (log) object support chaining.

The following methods all add column values to the message that is output but do not output the message:

* ```action``` - Sets the action column value to this string.
* ```logObj``` - Sets the data column value. Either pass in a key value pair, which is then added to the data
object, or an object, which the data object is then set to.
* ```set``` - Sets a value in a ```custom``` column and keeps this value for the duration of the Log object's
lifespan. This column is currently only output to the loggly transport.

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

_Note: This section needs to be updated._

The included express middleware are instantiated as follows:

```javascript
var LogMgr = require('epdoc-logger');

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

### routeSeparator ###

Adds a separator line to the log file for each new route.

### routeLogger ###

Adds an information line to the log file for each new route.

### More Information

It would be nice if there were more documentation for the logging methods, but in the meantime,
please refer to the source code in src/log.js.

## Test

Tests have not been updated, however I have started migrating these to mocha.

## Action Items

* The express middleware has not been tested since version 2.0.0 has been started.
* Add koa middleware (I don't currently have a koa project going, so this may not happen for awhile)
* Loggly support - DONE!

## Author

Jim Pravetz <jpravetz@epdoc.com>

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
