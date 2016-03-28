## Classes

<dl>
<dt><a href="#LogManager">LogManager</a></dt>
<dd></dd>
<dt><a href="#Logger">Logger</a></dt>
<dd><p>Logger</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#formatMS">formatMS(ms)</a> ⇒ <code>String</code></dt>
<dd><p>Format ms as MM:SS.mmm</p>
</dd>
<dt><a href="#action">action(...arguments)</a> ⇒ <code>*</code></dt>
<dd><p>Action is a unique column in the log output and is a machine-searchable verb that uniquely
describes the type of log event.</p>
</dd>
<dt><del><a href="#logObj">logObj(key, value)</a> ⇒ <code><a href="#Logger">Logger</a></code></del></dt>
<dd><p>Log a key,value or an object. If an object the any previous logged objects
are overwritten. If a key,value then add to the existing logged object.
Objects are written when a call to info, etc is made.</p>
</dd>
<dt><a href="#set">set(key, value)</a> ⇒ <code><a href="#Logger">Logger</a></code></dt>
<dd><p>Set <i>custom data</i> that is output in a separate column called <code>custom</code>.
This column must be specifically enabled via the LogManager constructor&#39;s <code>custom</code>
option.</p>
</dd>
<dt><a href="#data">data(key, [value])</a> ⇒ <code><a href="#Logger">Logger</a></code></dt>
<dd><p>Set a property in the <code>data</code> column.</p>
</dd>
<dt><del><a href="#resData">resData(key, value)</a> ⇒ <code><a href="#Logger">Logger</a></code></del></dt>
<dd><p>Set a property in the log data column, or set the value of the log data object.
Also sets the response data with the same value. This is used if you are using express
middleware, to set data that will be logged for the response (not sent with the reponse).
By using this method you can set data that is used in res.send() and in logging.</p>
</dd>
<dt><a href="#pushName">pushName(name)</a> ⇒</dt>
<dd><p>A method to add context to the method stack that has gotten us to this point in code.
The context is pushed into a stack, and the full stack is output as the &#39;module&#39; property
of the log message. Usually called at the entry point of a function.
Can also be called by submodules, in which case the submodules should call popRouteInfo when
returning Note that it is not necessary to call popRouteInfo when terminating a request with
a response.</p>
</dd>
<dt><a href="#popName">popName(options)</a> ⇒</dt>
<dd><p>See pushRouteInfo. Should be called if returning back up a function chain. Does not need to
be called if the function terminates the request with a response.</p>
</dd>
</dl>

<a name="LogManager"></a>

## LogManager
**Kind**: global class  

* [LogManager](#LogManager)
    * [new LogManager(options)](#new_LogManager_new)
    * [.setTransport(type, options)](#LogManager+setTransport)
    * [.unsetTransport()](#LogManager+unsetTransport)
    * [.getTransportByName()](#LogManager+getTransportByName) ⇒ <code>\*</code>
    * [.getCurrentTransport()](#LogManager+getCurrentTransport) ⇒ <code>\*</code>
    * [.setStartTime(d)](#LogManager+setStartTime)
    * [.getStartTime()](#LogManager+getStartTime) ⇒ <code>Number</code>
    * [.get(moduleName, opt_context)](#LogManager+get) ⇒
    * [.logMessage(level, action, msg, data)](#LogManager+logMessage)
    * [.logParams(msgParams)](#LogManager+logParams)
    * [.setLevel(level)](#LogManager+setLevel)
    * [.isAboveLevel()](#LogManager+isAboveLevel)
    * [.writeCount()](#LogManager+writeCount)
    * [.getCount()](#LogManager+getCount) ⇒ <code>Object</code>
    * [.flushing()](#LogManager+flushing) ⇒ <code>Promise</code>
    * [.format()](#LogManager+format)

<a name="new_LogManager_new"></a>

### new LogManager(options)
Create a new LogManager using the default ConsoleTransport. The logger will not begin writing
to the transport unless you set autoRun = true or call setTransport or call start.
To use a different transport, set the transport using setTransport('file').
You will likely have one LogManager per application, then call logMgr.get() to get a log
object which you will use for logging messages.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | { autoRun: false, sid: false, custom: boolean, level: string,   transport: { string } Note that if transport has any parameters, you should set it using the   setTransport method. |

<a name="LogManager+setTransport"></a>

### logManager.setTransport(type, options)
Set log target by unshifting the provided transport object onto the list of transports.
The default transport, before any is unshifted onto the list of transports, is the console
transport. If you add a transport (eg. file transport) then later remove it, the previously
set logger (eg. console) will be used.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  

| Param | Type | Description |
| --- | --- | --- |
| type |  | For the provided loggers, one of 'sos', 'file', 'line', or 'console'. For a   custom transport this should be a transport class object that can be instantiated with   'new'. To create your own transport class, use getLoggerClass('console') and then subclass   this class. |
| options | <code>string</code> | are passed to the transport when constructing the new transport object.   Options for the predefined transports are:      path  path to file, used by file transport      timestamp {string} one of 'iso', 'smstime' or 'ms', defaults to 'ms' but may be overriden by   transport requirements (e.g. loggly uses iso) sid {boolean} whether to include sessionId and reqId   columns in log output (used with express and other request/response apps), overrides   LogMgr setting. custom {boolean} Indicates whether to include 'custom' column or not,   overrides LogMgr setting. |

<a name="LogManager+unsetTransport"></a>

### logManager.unsetTransport()
Unset the last logger. The latest logger is shifted off the list of loggers.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
<a name="LogManager+getTransportByName"></a>

### logManager.getTransportByName() ⇒ <code>\*</code>
Return one of the predefined transport objects. If you want to define your own class,
it is suggested you subclass or copy one of the existing transports.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
**Returns**: <code>\*</code> - LogManager Class for which you should call new with options, or if creating
  your own transport you may subclass this object.  
<a name="LogManager+getCurrentTransport"></a>

### logManager.getCurrentTransport() ⇒ <code>\*</code>
Get the current transport logger.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
**Returns**: <code>\*</code> - The current transport, a subclass of console.js. Call type() on the return value
to determine it's type.  
<a name="LogManager+setStartTime"></a>

### logManager.setStartTime(d)
Set automatically when this moduel is initialized, but can be set manually to the earliest
known time that the application was started.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  

| Param |
| --- |
| d | 

<a name="LogManager+getStartTime"></a>

### logManager.getStartTime() ⇒ <code>Number</code>
Get the time at which the module was initialized

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
**Returns**: <code>Number</code> - Start time in milliseconds  
<a name="LogManager+get"></a>

### logManager.get(moduleName, opt_context) ⇒
Return a new module logger object instance using the specified module name.
Although it's a new logger instance, it still uses the same underlying
'writeMessageParams' method, and whatever transport is set globally.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
**Returns**: A new logger object.  

| Param | Type | Description |
| --- | --- | --- |
| moduleName |  | Name of module or file, added as a column to log output |
| opt_context | <code>object</code> | A context object. For Express or koa this would have 'req' and   'res' properties. The context.req may also have reqId and sid/sessionId/session.id   properties that are used to populate their respective columns of output. Otherwise these   columns are left blank on output. |

<a name="LogManager+logMessage"></a>

### logManager.logMessage(level, action, msg, data)
Same as logParams with just these parameters set.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  

| Param |
| --- |
| level | 
| action | 
| msg | 
| data | 

<a name="LogManager+logParams"></a>

### logManager.logParams(msgParams)
Write a raw message. We queue messages to handle the moment in time while we are switching
streams and the new stream is not ready yet. We do queuing while we wait for it to be ready.
You can completely bypass creating a logger instance in your class if you use this call
directly, In this situation the log level filtering will be established by the log level
(this.logLevel).

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
**Params**: opt_thresholdLevel {string} Specify the threshold log level above which to display this log message.  

| Param | Description |
| --- | --- |
| msgParams | includes:      level - Must be one of LEVEL_ORDER values, all lower case      sid - (Optional) sessionID to display      module - (Optional) Module descriptor to display (usually of form route.obj.function)      time - (Optional) A date object with the current time, will be filled in if not   provided      timeDiff - (Optional) The difference in milliseconds between 'time' and when the   application was started, based on reading LogManager.getStartTime() message - A string or   an array of strings. If an array the string will be printed on multiple lines where   supported (e.g. SOS). The string must already formatted (e.g.. no '%s') |

<a name="LogManager+setLevel"></a>

### logManager.setLevel(level)
Set the LogManager objects's minimum log level

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  

| Param | Type | Description |
| --- | --- | --- |
| level | <code>string</code> | Must be one of LEVEL_ORDER |

<a name="LogManager+isAboveLevel"></a>

### logManager.isAboveLevel()
Return true if the level is equal to or greater then the LogManager's logLevel property.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
<a name="LogManager+writeCount"></a>

### logManager.writeCount()
Write a count of how many of each level of message has been output.
This is a useful function to call when the application is shutdown.

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
<a name="LogManager+getCount"></a>

### logManager.getCount() ⇒ <code>Object</code>
Return a count object

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
**Returns**: <code>Object</code> - with properties for 'warn', 'info', etc.  
<a name="LogManager+flushing"></a>

### logManager.flushing() ⇒ <code>Promise</code>
Flush the queue of the current transport

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
<a name="LogManager+format"></a>

### logManager.format()
Shortcut to util.format()

**Kind**: instance method of <code>[LogManager](#LogManager)</code>  
<a name="Logger"></a>

## Logger
Logger

**Kind**: global class  

* [Logger](#Logger)
    * [new Logger(logMgr, opt_modulename, opt_context)](#new_Logger_new)
    * [.elapsed()](#Logger+elapsed) ⇒ <code>Object</code>
    * [.hrElapsed([key])](#Logger+hrElapsed) ⇒ <code>[Logger](#Logger)</code>
    * [.getHrElapsed()](#Logger+getHrElapsed) ⇒ <code>number</code>
    * [.resetElapsed()](#Logger+resetElapsed) ⇒ <code>[Logger](#Logger)</code>
    * [.log([level], msg)](#Logger+log)
    * [.logParams(params)](#Logger+logParams) ⇒ <code>\*</code>
    * [.setLevel(level)](#Logger+setLevel) ⇒ <code>[Logger](#Logger)</code>
    * [.isAboveLevel(level)](#Logger+isAboveLevel) ⇒ <code>boolean</code>

<a name="new_Logger_new"></a>

### new Logger(logMgr, opt_modulename, opt_context)
Logging module. Shows time and log level (debug, info, warn, error).
Time is shown in milliseconds since this module was first initialized.


| Param | Type | Description |
| --- | --- | --- |
| logMgr | <code>[Logger](#Logger)</code> | The parent LogManager object that specifies the transport and provides   output methods |
| opt_modulename | <code>string</code> &#124; <code>Array</code> | The name of the module or emitter that is emitting the log   message, used to populate the module column of logMgr output. This can be modified to show the   calling stack by calling pushName and popName. |
| opt_context | <code>object</code> | A context object. For Express or koa this would have 'req' and 'res'   properties. |

**Example**  
```js
var log = require('../lib/logMgr').get('logtest');
       log.info( 'Message: %s', 'my message');

Create a new log object with methods to log to the transport that is attached to `logMgr`.
This log object can be attached to another object, for example an express response object,
in order to next the log call and thereby carry context down thru the calling stack.
If a context is passed in, various properties may be harvested off of the req property. These
include: req._reqId (populates reqId column), req.sid?req.session.id|req.sessionId (populates
sid column), req._startTime and req._hrStartTime (can be used to determine response time for a
request).
```
<a name="Logger+elapsed"></a>

### logger.elapsed() ⇒ <code>Object</code>
Used to measure the duration of requests or other events.
Add an 'elapsed' attribute to data being output, which is the time
since this request object was initialized.
Requirement: One of the following three must be initialized:
     1. request object must set it's _delayTime
     2. request object must set it's _startTime (ms)
     3. must have called resetElapsed() to reset this.t0

**Kind**: instance method of <code>[Logger](#Logger)</code>  
**Returns**: <code>Object</code> - this  
<a name="Logger+hrElapsed"></a>

### logger.hrElapsed([key]) ⇒ <code>[Logger](#Logger)</code>
Adds the High Resolution response time to the data column.

**Kind**: instance method of <code>[Logger](#Logger)</code>  
**Returns**: <code>[Logger](#Logger)</code> - Self.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [key] | <code>string</code> | <code>&quot;elapsed&quot;</code> | Name of property in the data column. |

<a name="Logger+getHrElapsed"></a>

### logger.getHrElapsed() ⇒ <code>number</code>
High resolution response time.
Returns the response time in milliseconds with two digits after the decimal.

**Kind**: instance method of <code>[Logger](#Logger)</code>  
**Returns**: <code>number</code> - Response time in milliseconds  
<a name="Logger+resetElapsed"></a>

### logger.resetElapsed() ⇒ <code>[Logger](#Logger)</code>
Reset the elapsed time timer.

**Kind**: instance method of <code>[Logger](#Logger)</code>  
**Returns**: <code>[Logger](#Logger)</code> - Self  
<a name="Logger+log"></a>

### logger.log([level], msg)
Output a log message, specifying the log level as the first parameter, and a string
with util.format syntax as a second parameter,
for example myLogger.log('info', 'test message %s', 'my string');
The second parameter can optionally be an array of strings or arrays, each one of which
will be treated as input to util.format. This is useful for logMgrs that support
folding (muli-line output).
Example: log.log( 'info', [["Found %d lines", iLines],"My second line",["My %s
line",'third']]); );

**Kind**: instance method of <code>[Logger](#Logger)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [level] | <code>string</code> | <code>&quot;info&quot;</code> | One of Logger.LEVEL_ORDER. Defaults to `info` if not present. |
| msg | <code>string</code> |  | The message String, or an array of strings, to be formatted with   util.format. |

<a name="Logger+logParams"></a>

### logger.logParams(params) ⇒ <code>\*</code>
Log a raw message in the spirit of Logger.logMessage, adding sid and reqId columns from
this.ctx.req Looks for sessionID in req.session.id or req.sessionId, otherwise uses the
passed in values for sid and reqId (if any). This is the method that calls the underlying
logging outputter. If you want to use your own logging tool, you can replace this method, or
provide your own transport.

**Kind**: instance method of <code>[Logger](#Logger)</code>  

| Param |
| --- |
| params | 

<a name="Logger+setLevel"></a>

### logger.setLevel(level) ⇒ <code>[Logger](#Logger)</code>
Set the log level for this object. This overrides the global log level for this object.

**Kind**: instance method of <code>[Logger](#Logger)</code>  
**Returns**: <code>[Logger](#Logger)</code> - Self  

| Param | Type | Description |
| --- | --- | --- |
| level | <code>string</code> | Must be one of LogManager.LEVEL_ORDER. |

<a name="Logger+isAboveLevel"></a>

### logger.isAboveLevel(level) ⇒ <code>boolean</code>
Test if the given level is above the log level set for this Logger object.

**Kind**: instance method of <code>[Logger](#Logger)</code>  
**Returns**: <code>boolean</code> - True if the level is equal to or greater then the reference, or if
  reference is null.  

| Param | Type | Description |
| --- | --- | --- |
| level | <code>string</code> | Must be one of LogManager.LEVEL_ORDER. |

<a name="formatMS"></a>

## formatMS(ms) ⇒ <code>String</code>
Format ms as MM:SS.mmm

**Kind**: global function  

| Param |
| --- |
| ms | 

<a name="action"></a>

## action(...arguments) ⇒ <code>\*</code>
Action is a unique column in the log output and is a machine-searchable verb that uniquely
describes the type of log event.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| ...arguments | <code>string</code> | Single string or multiple strings that are then joined with a   '.'. |

<a name="logObj"></a>

## ~~logObj(key, value) ⇒ <code>[Logger](#Logger)</code>~~
***Deprecated***

Log a key,value or an object. If an object the any previous logged objects
are overwritten. If a key,value then add to the existing logged object.
Objects are written when a call to info, etc is made.

**Kind**: global function  

| Param | Description |
| --- | --- |
| key | If a string or number then key,value is added, else key is added |
| value | If key is a string or number then data.key is set to value |

<a name="set"></a>

## set(key, value) ⇒ <code>[Logger](#Logger)</code>
Set <i>custom data</i> that is output in a separate column called ```custom```.
This column must be specifically enabled via the LogManager constructor's ```custom```
option.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> &#124; <code>object</code> | If a string then sets custom.key = value, otherwise extends   custom with key |
| value | <code>\*</code> | (Optional) Set key to this value |

<a name="data"></a>

## data(key, [value]) ⇒ <code>[Logger](#Logger)</code>
Set a property in the ```data``` column.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> &#124; <code>object</code> | If a string then sets ```data[key]``` to ```value```. Otherwise   extend the object ```data``` the object ```key```. |
| [value] | <code>string</code> | If key is a string then sets data[key] to this value. |

<a name="resData"></a>

## ~~resData(key, value) ⇒ <code>[Logger](#Logger)</code>~~
***Deprecated***

Set a property in the log data column, or set the value of the log data object.
Also sets the response data with the same value. This is used if you are using express
middleware, to set data that will be logged for the response (not sent with the reponse).
By using this method you can set data that is used in res.send() and in logging.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> &#124; <code>object</code> | If a string then sets data[key] to value. Otherwise sets data to   key. |
| value |  | If key is a string then sets data[key] to this value. |

<a name="pushName"></a>

## pushName(name) ⇒
A method to add context to the method stack that has gotten us to this point in code.
The context is pushed into a stack, and the full stack is output as the 'module' property
of the log message. Usually called at the entry point of a function.
Can also be called by submodules, in which case the submodules should call popRouteInfo when
returning Note that it is not necessary to call popRouteInfo when terminating a request with
a response.

**Kind**: global function  
**Returns**: Response object  

| Param | Description |
| --- | --- |
| name | (required) String in the form 'api.org.create' (route.method or   route.object.method). |

<a name="popName"></a>

## popName(options) ⇒
See pushRouteInfo. Should be called if returning back up a function chain. Does not need to
be called if the function terminates the request with a response.

**Kind**: global function  
**Returns**: Response object  

| Param | Description |
| --- | --- |
| options | Available options are 'all' if all action contexts are to be removed from the   _logging stack. |

