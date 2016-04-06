# epdoc-logger #

A logging module supporting built-in and custom transports, Express 4 response mixins, 
rich message and data syntax, chainable methods for recording log events, and a 
callback transport to allow unit testing via log messages.
Generally supports [Winston's](https://github.com/winstonjs/winston) logging method calls
for simpler messages, but with the addition of a substantial number of new methods, 
many of which can be chained to create richer output with more columns of data.

[This page and API Reference are also formatted and available here](http://jpravetz.github.io/epdoc-logger/out/index.html).


## Install

```bash
npm install --save epdoc-logger
```

## Quick Start

Log to the console.

```javascript
var log = require('epdoc-logger').start().get();

log.info("Hello world");
```

```bash
["00:00.001","INFO",0,"","logger","logger.push.success","Set logger to Console",{},{"transport":"Console"}]
["00:00.015","INFO",0,"","","","Hello world",{}]
```


Buffer messages until your logger is set up, then output to a file.

```javascript
var logMgr = require('epdoc-logger').logMgr();
var log = logMgr.get('main');
log.info("Starting application");

var config = require('config.json');
logMgr.setTransport('file',{path:config.logFile,timestamp:'iso'}); 

log.info("Hello world");
```

```bash
["2016-03-29T04:19:45.920Z","INFO","main","","Starting application"]
["2016-03-29T04:19:45.922Z","INFO","logger","logger.push","Setting logger to File (/path/to/file.log)",{"transport":"File (/path/to/file.log)"}]
["2016-03-29T04:19:45.924Z","INFO","logger","logger.push.success","Set logger to File (/path/to/file.log)",{"transport":"File (/path/to/file.log)"}]
["2016-03-29T04:19:45.926Z","INFO","main","","Hello world"]
```

Log to [loggly.com](http://loggly.com), buffering and making batch calls to loggly.

```javascript
var logMgr = require('epdoc-logger').logMgr();
var log = logMgr.get('main');
log.info("Starting application");

logMgr.setTransport('loggly',{token:'MyToken'}); 

log.info("Hello world");

// log a message count for all the different log levels
logMgr.writeCount();

// Shutdown properly so loggly message buffer is flushed
logMgr.destroying().then(function() {
    done();
}, function(err) {
    done(err);
});

```

## Classes

There are two main objects used for logging:
 
- {@link LogManager}
 - Usually a singleton
 - Used to configure the transport, set global options, and start writing to the transport
 - Can also be used to directly write to the transport (see {@link LogManager#logParams} and {@link LogManager#logMessage})
 - See the [Log Manager API Reference]{@link LogManager}
- {@link Logger}
 - A per-emitter object
 - Create a new log object for every file (emitter), or for every request
 - Chainable methods via which to write log output
 - See the [Logger API Reference]{@link LogManager}
 
You can access these two classes off of the exported epdoc-logger module:

```javascript
var epdocLogger = require('epdoc-logger');
var LogManager = epdocLogger.LogManager;
var Logger = epdocLogger.Logger;
```

### LogManager Class

A shortcut for getting a {@link LogManager} singleton is to call the module's ```logMgr``` method.

```javascript
var logMgr = require('epdoc-logger').logMgr();
```

This is equivalent to:

```javascript
var epdocLogger = require('epdoc-logger');
var LogManager = epdocLogger.LogManager;
var logMgr = new LogManager();
```

Because you may need to load config information before configuring your transport you must 
explicitly start logging by calling {@link LogManager#start}. And because some 
log tranports are buffered, you should also call {@link LogManager#flushing} or 
{@link LogManager#destroying} before shutting down.

## Logger Class

{@link Logger} object are created by calling ```new Logger()```. Typically you would create a new Logger object for
every javascript file and set a unique module name (_aka emitter_)_ for that object. 
Alternatively, when responding to requests, for example when using [Express](http://expressjs.com),
it is a better idea to tie the emitter to the request. This is described later in this document.

Loggers are created by calling {@link LogManager#get}.

```javascript
var log = logMgr.get('emitter-name');

// This is equivalent
var log = new Logger(logMgr,'emitter-name');

// A shortcut that is also equivalent and that uses a global LogManager object
var log = require('epdoc-logger').get('emitter-name');
```



## Configuring Transports

The module has built-in support for the following transports and can output to multiple transports at the same time.

* {@link ConsoleTransport} - logs to the console (default)
* {@link FileTransport} - logs to a file
* SOSTransport - Logs to [SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/). _SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose._ Note that SOS Max appears to not work on the latest version of Mac OS X.
* {@link CallbackTransport} - A line buffer/callback transport useful for automated testing
* {@link LogglyTransport} - Logs to the online [loggly.com](http://loggly.com) service.

On startup the logger can wait for a transport to be initialized before starting to write log messages, or will begin writing log messages
immediately when {@link LogManager#autoRun} is set. 
By default the logger uses the Console Transport and must be started manually.

If {@link LogManager#autoRun} is not set, then a call to {@link LogManager#start} will begin logging. 
Messages are buffered prior to this method being called, so prior to this event no messages will be lost and there is time to configure transports.

Transports are configured via properties passed to {@link LogManager#setTransport}, {@link LogManager#addTransport} 
or {@link LogManager#new}. 
Transport configuration properties are passed directly to the transport. Refer to the individual transport API reference documents for more information.

Multiple transports can be configured to be run at the same time using {@link LogManager#addTransport}. 
When either the {@link LogManager#setTransport} or {@link LogManager#addTransport} methods are called, the default transport is disabled.

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

Transports can also be closed using {@link LogManager#clearTransports}, or can sometimes close on their own.
In this event logging will revert to the default (Console) transport. 
For example, if you specify an SOS transport and the SOS application is closed, 
logging will return back to the console and the console will be (re)started automatically. 
If an active transport closes on it's own (_e.g._ SOS Max application exits) 
the transport is removed.

The Logger will buffer messages while switching transports,
however individual transports can do their own buffering (_e.g._ file).
If a transport closes prematurely, it's buffer may be lost.

## Logging Example ##

```javascript
// Get the global logger object

var logMgr = require('epdoc-logger').logMgr({sid:false});

// Logger static methods

logMgr.setTransport( 'file', { path: 'path/to/myfile.log', dateFormat: 'ISO', sid: false } );
var loggerType = logMgr.getCurrentTransport().type();        // Will return the transport type of the logger
logMgr.setLevel( 'warn' );
var startTime = logMgr.getStartTime();                    // Milliseconds

// Get a Logger object for this file or module

var log = logMgr.get('MyClassName');

// Instance methods. Each line outputs a message.

log.data('a',1).data('b',[2,3]).info();
log.data({a:1,b:[2,3]}).info("My message");
log.info( "I just want to say %s to the %s", "Hello", "World" );
log.action('obj.update').debug( "We %s formatted messages", "do" );
log.error( new Error("My error") );
log.verbose( "The default is to not output verbose messages, so this will not by default be output" );
log.warn( "Danger Will Robinson, danger" );
log.fault( "Restarting server in %d seconds", 10 );

// Outputs a new message
log.date();             // Output now's date/time
log.separator();        // Output a line separator

log.log( 'info', "This method %s supports util.format style formating", "also" );

// Enable verbose messages to be output for this log object (overrides global setting)
log.setLevel( "verbose" );
```

### {@link Logger} Method Chaining ###

Most {@link Logger} methods support chaining.

The following methods all add column values to the message that is output but do not output the message:

* ```action``` - Sets the action column value to this string.
* ```data``` - Sets the data column value. Either pass in a key value pair, which is then added to the data
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


## Log Levels ##

Log level defaults are set in {@link LogManager#new}:

```javascript
this.LEVEL_DEFAULT = 'debug';       // Default threshold level for outputting logs
this.LEVEL_INFO = 'info';           // If changing LEVEL_ORDER, what level should internally generated info messages be output at?
this.LEVEL_WARN = 'warn';           // If changing LEVEL_ORDER, what level should internally generated warn messages be output at?
this.LEVEL_ORDER = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'];
```

You can _customize_ log levels by setting the value of this array after constructing your LogManager object.
Any subsequently created Logger objects will have methods with the names you have provided. 
Please use lowercase log level names. They will be changed to uppercase by transports, where appropriate.

The level at which messages are output can be controlled at three points:

- {@link Logger#constructor} or {@link Logger#setLevel} - This log level will override log levels set by the LogManager
- {@link LogManager#constructor} or {@link LogManager#setLevel} - This becomes the default log level for all {@link Logger} objects and transports.
- At the Transport level by passing in the option ```level```. This will override the value set for the LogManager.

## Express Middleware ##

The included express middleware are instantiated as follows:

```javascript
var middleware = require('epdoc-logger').middleware();

var app = express();
app.use(middleware.reqId());

app.use(app.router);
app.all('*', middleware.responseLogger());
app.all('*', middleware.routeSeparator());
app.all('*', middleware.routeLogger());
```

See test/app.express.js for an example of how to use a stub request and response method to test middleware.
This technique can also be useful if you wish to use the req/res/next mechanism in non-express environments.
As an example, you could have req/res objects for tracking AMQP (RabbitMQ) or AWS SQS requests and
associating request or session IDs.

### [ReqId]{@link module:middleware/reqId}

Adds ```_reqId``` and ```_hrStartTime``` to the request object. These are used later when logging.

### [ResponseLogger]{@link module:middleware/responseLogger} ###

The responseLogger middleware mixes custom logging methods, similar to those in the logging object,
into the express ```response``` object. This will add request-context-sensitive logging information
to each log message.

As with the logging object, most methods can be chained. An example usage:

```javascript
function myFunction(req,res,params) {
    res.pushRouteInfo('myFunction');
    res.action('complete').data(params).info('Entering function');
    res.popRouteInfo();
}
```

### [RouteSeparator]{@link module:middleware/routeSeparator} ###

Adds a separator line to the log file for each new route.

### [RouteLogger]{@link module:middleware/routeLogger} ###

Adds an information line to the log file for each new route.

## Action Items

* Add koa middleware (I don't currently have a koa project going, so this may not happen for awhile)
* More unit tests

## Author

Jim Pravetz <jpravetz@epdoc.com>

## License

[MIT](https://github.com/strongloop/express/blob/master/LICENSE)
