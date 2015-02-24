/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Logging module. Shows time and log level (debug, info, warn, error).
 * Time is shown in milliseconds since this module was first initialized.
 * Usage:
 *        var log = require('../lib/logger').get('logtest');
 *        log.info( 'Message: %s', 'my message');
 */

const LEVEL_ORDER = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'];
const DEFAULT_BUFFER_DURATION = 1000; // ms

var _ = require('underscore');
var util = require('util');
var DateUtil = require('./dateutil');
var ConsoleStream = require('./transports/console');

// Static containing the time that this module was first initialized.
// Modules are loaded only once, so this will only be set once.
var t0 = (new Date()).getTime();

// Static stack containing stream where output should be written
var aStreams = [new ConsoleStream()];

// Keep a count of how many errors, warnings, etc
var gLogCount = {};

// Static global holds a queue of messages that may build up while we are switching streams
// Streams do their own buffering to their own output
var queue = [];

// Static buffer duration
var gBufferDuration = DEFAULT_BUFFER_DURATION;

// Static global log level
var gLogLevel = 'debug';

// Static custom callback to use if an object is passed in as first parameter of log method
// var gGetSessionIdCallback;


var Logger = function( modulename ) {

    var self = this;
    this.name = modulename + " logger";     // Displayed in some IDE debuggers to identify this object
    this.moduleName = modulename;
    this.logLevel;
    this.logData;
    this.logAction;

    /**
     * Log an info message. The message can contain arguments (e.g 'Hello %s', 'world')
     */
    this.info = function() {
        return self.logArgs('info', Array.prototype.slice.call(arguments));
    };

    this.warn = function() {
        return self.logArgs('warn', Array.prototype.slice.call(arguments));
    };

    this.debug = function() {
        return self.logArgs('debug', Array.prototype.slice.call(arguments));
    };

    this.verbose = function() {
        return self.logArgs('verbose', Array.prototype.slice.call(arguments));
    };

    this.error = function() {
        return self.logArgs('error', Array.prototype.slice.call(arguments));
    };

    this.fatal = function() {
        return self.logArgs('fatal', Array.prototype.slice.call(arguments));
    };

    this.separator = function() {
        if( self.isAboveLevel('info') ) {
            self._writeMessage('info', "######################################################################");
        }
        return this;
    };

    /**
     * Action is a unique column in the log output and is a machine-searchable verb that uniquely describes the type of log event.
     * arguments String or comma separated list of strings that are then joined with a '.'
     * @returns {*}
     */
    this.action = function() {
        if( arguments[0] instanceof Array ) {
            self.logAction = arguments[0].join('.');
        } else if( arguments.length > 1 ) {
            self.logAction = Array.prototype.join.call(arguments, '.');
        } else {
            self.logAction = arguments[0];
        }
        return self;
    };

    /**
     * Log a key,value or an object. If an object the any previous logged objects
     * are overwritten. If a key,value then add to the existing logged object.
     * Objects are written when a call to info, etc is made
     * @param key If a string or number then key,value is added, else key is added
     * @param value If key is a string or number then data.key is set to value
     * @return The logging object, for chaining
     */
    this.logObj = function( key, value ) {
        if( typeof key === 'string' || typeof key === 'number' ) {
            if( !self.logData ) {
                self.logData = {};
            }
            self.logData[key] = value;
        } else {
            self.logData = key;
        }
        return self;
    };

    /**
     * Deprecated. Used error() instead.
     */
    this.logErr = function( err ) {
        if( !self.logData ) {
            self.logData = {};
        }
        self.logData.error = err;
        return self;
    };

    /**
     * Deprecated. Used logObj instead.
     */
    this.data = function( key, value ) {
        return self.logObj(key, value);
    };

    this.date = function( d, s ) {
        if( self.isAboveLevel('info') ) {
            d = d || new Date();
            self.logAction = s || 'currentTime';
            self.logObj({
                localtime: DateUtil.toISOLocalString(d),
                utctime: d.toISOString(),
                uptime: DateUtil.formatMS(d - t0)
            });
            self.logArgs('info', []);
//			var logMsg = util.format( "[%s] INFO: %s - === CURRENT TIME  %s ====", DateUtil.formatMS(d.getTime()-t0,0), (this.moduleName ? this.moduleName : ""), DateUtil.toISOLocalString(d) );
//			writeMessage( logMsg );
        }
        return self;
    };

    // Helper, level must be set, args must be an array, but can be empty
    this.logArgs = function( level, args ) {
        if( !args.length ) {
            args.unshift('');
        } else if( args.length && ( args[0] === undefined || args[0] === null ) ) {
            args.shift();
        }
        args.unshift(level);
        return self.log.apply(this, args);
    };

    /**
     * Output a log message. This function is suitable for providing to classes that require logging callbacks.
     * It can also be used for multiline (folded) log messages.
     * Example: log.log( 'info', req, "Found %d lines", iLines );
     * @param level One of warn, debug, error or info. Defaults to info if not present.
     * @param object Optional object that has a callback gGetSessionIdCallback
     * @param msg The message String, or an array of strings. Will be formatted
     */
    this.log = function() {
        var args = Array.prototype.slice.call(arguments);
        if( args.length ) {
            if( args.length === 1 ) {
                args.unshift('info');
            }
            if( self.isAboveLevel(args[0]) ) {
                self._writeMessage.apply(this, args);
            }
        }
        return self;
    };

//    this.hasSessionObjAsNthEntry = function(args,index) {
//        if( index === undefined )
//            index = 0;
//        if( gGetSessionIdCallback && args.length > 1 && (typeof args[index] === 'object') && ( typeof args[index][gGetSessionIdCallback] === 'function') )
//            return true;
//        return false;
//    };

    // Expects level, msg params
    this._writeMessage = function( level, msg ) {
        var args = Array.prototype.slice.call(arguments);
        if( args.length > 1 ) {
            var params = {module: self.moduleName};
            params.level = args.shift();
            if( self.logData ) {
                params.data = self.logData;
                delete self.logData;
            }
            if( self.logAction ) {
                params.action = self.logAction;
                delete self.logAction;
            }
            if( args.length === 1 && (args[0] instanceof Array) ) {
                params.message = [];
                for( var idx = 0; idx < args[0].length; ++idx ) {
                    params.message.push(util.format.apply(this, (args[0][idx] instanceof Array) ? args[0][idx] : [args[0][idx]]));
                }
            } else {
                params.message = util.format.apply(this, args);
            }
            writeMessageParams(params);
        }
    };

    // Not called. Placeholder in case we ever support managed shutdown
    this.destroy = function() {
        while( aStreams.length ) {
            var stream = aStreams.shift();
            if( stream ) {
                stream.end();
                stream.destroy();
            }
        }
    };

    /**
     * Set the log level for this object. This overrides the global log level for this object.
     */
    this.setLogLevel = function( level ) {
        self.logLevel = level;
        return this;
    };

    /**
     * Return true if the level is equal to or greater then the reference, or if reference is null
     */
    this.isAboveLevel = function( level ) {
        var reference = self.logLevel || gLogLevel;
        if( LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(reference) ) {
            return true;
        }
        return false;
    };

    /**
     * Tests for fatal or error conditions and exits the app if either is found.
     * @param options { warn: true } Set if we should exit on warnings as well.
     * @param callback Called if there are no fatal or error conditions.
     */
    this.exitOnError = function( options, callback ) {
        if( gLogCount.error || gLogCount.fatal ) {
            doExit();
        } else if( options.warn && gLogCount.warn ) {
            doExit();
        } else {
            this.action('exit').logObj('exit', 0).logObj('counts', gLogCount).info();
            callback && callback();
        }

        function doExit() {
            this.action('exit').logObj('exit', 1).logObj('counts', gLogCount).fatal();
            process.exit(1);
        }
    };


};

//function timeDiff() {
//    return (new Date()).getTime() - t0;
//}

/**
 * Get the time at which the module was initialized
 * @return {Number} Start time in milliseconds
 */
module.exports.getStartTime = function() {
    return t0;
};

/**
 * Shortcut to util.format()
 */
module.exports.format = function() {
    return util.format.apply(this, arguments);
};


/**
 * Return an instance of the logger that has the module name set.
 */
module.exports.get = function( moduleName ) {
    return new Logger(moduleName);
};

/**
 * Return Express Middleware
 * Usage:
 *      var reqId = require('logger').middleware().reqId;
 *      app.use(reqId());
 */

module.exports.middleware = function() {
    return {
        reqId: require('./middleware/reqId'),
        responseLogger: require('./middleware/responseLogger'),
        routeLogger: require('./middleware/routeLogger'),
        routeSeparator: require('./middleware/routeSeparator')
    };
};

module.exports.response = require('./stubs/response');
module.exports.request = require('./stubs/request');


/**
 * Set log level globally
 */
module.exports.setGlobalLogLevel = function( level ) {
    gLogLevel = level;
};

/**
 * If an object is passed in as the first parameter of the log method, and there are subsequent
 * objects in the argument list, then test if that object has this function assigned and, if it does
 * call it to return a string that is to be included in the log message string as the a session ID.
 * @param fnName The object's function name to be called
 */
//module.exports.setSessionIdCallback = function( fnName ) {
//    gGetSessionIdCallback = fnName;
//}


/**
 * Write a raw message. We queue messages to handle the moment in time while we are switching
 * streams and the new stream is not ready yet. We do queuing while we wait for it to be ready.
 * You can completely bypass creating a logger instance in your class if you use this call directly,
 * In this situation the log level filtering will be established by the global log level (gLogLevel).
 * @param msgParams includes:
 *      level - Must be one of LEVEL_ORDER values, all lower case
 *      sid - (Optional) sessionID to display
 *      module - (Optional) Module descriptor to display (usually of form route.obj.function)
 *      time - (Optional) A date object with the current time, will be filled in if not provided
 *      timeDiff - (Optional) The difference in milliseconds between 'time' and when the application was
 *          started, based on reading Logger.getStartTime()
 *      message - A string or an array of strings. If an array the string will be printed on multiple lines
 *          where supported (e.g. SOS). The string must already formatted (e.g.. no '%s')
 */
module.exports.logMessage = writeMessageParams;
function writeMessageParams( msgParams ) {
    if( msgParams ) {
        if( !msgParams.level ) {
            msgParams.level = 'info';
        }
        if( gIsAboveLevel(msgParams.level) ) {
            if( !msgParams.time ) {
                msgParams.time = new Date();
            }
            if( !msgParams.timeDiff ) {
                msgParams.timeDiff = msgParams.time.getTime() - t0;
            }
            queue.push(msgParams);
        }
        if( msgParams.length && msgParams.message && msgParams.message.length > msgParams.length ) {
            msgParams.message = msgParams.message.substr(0, msgParams.length) + "...";
        }
        gLogCount[msgParams.level] = 1 + (gLogCount[msgParams.level] || 0);
    }
    flushQueue();
};


/**
 * Return true if the level is equal to or greater then the globally set log level
 */
function gIsAboveLevel( level ) {
    if( LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(gLogLevel) ) {
        return true;
    }
    return false;
};


function flushQueue() {
    if( aStreams[0].ready() ) {
        var nextMsg = queue.shift();
        if( nextMsg ) {
            aStreams[0].write(nextMsg);
            flushQueue();
        }
    }
}

function writeLoggerMessage( level, action, msg, data ) {
    var params = {module: 'logger', level: level, action: action, message: msg};
    if( data ) {
        params.data = data;
    }
    writeMessageParams(params);
}

/**
 * Write a count of how many of each time of message has been output, based on levels
 */
module.exports.writeCount = function() {
    writeMessageParams({
        module: 'logger',
        action: 'counts',
        data: gLogCount
    });
}

module.exports.getCount = function() {
    return gLogCount;
};


/**
 * Set log target by pushing the logger onto the stack of loggers. Defaults to console.
 * @param name Name of log target. Currently supports the following targets: [ 'sos' ]
 * @param type - one of 'sos', 'file', or 'console', or a Transport class that can be instantiated.
 * To create your own class, use getLoggerClass('console') and then subclass this class.
 * @param options contains:
 *      path - path to file, used by file transport
 *      bIncludeSid - whether to include sessionId and reqId columns in log output (used with express and other request/response apps)
 *      dateFormat - one of 'ISO' or 'formatMS', defaults to 'formatMS'
 */
module.exports.setLogger = function( type, options ) {

    var Logger;
    if( _.isString(type) ) {
        Logger = require('./transports/' + type);
    } else if( _.isObject(type) ) {
        Logger = type;
    }
    if( Logger ) {
        var stream = new Logger(options);
        var err = stream.validateOptions( aStreams[0] );
        if( !err ) {
            writeLoggerMessage("info", "logger.push", "Setting logger to " + stream, {stream: stream.toString()});
            aStreams[0].end();
            aStreams.unshift(stream);
            stream.open(onSuccess, onError, onClose);

            function onSuccess() {
                stream.clear();
                writeLoggerMessage("info", "logger.push.success", "Set logger to " + stream, {stream: stream.toString()});
            };

            function onError( err ) {
                writeLoggerMessage("warn", "logger.push.warn", "Tried but failed to set logger to " + stream + ": " + err);
                unsetLogger();
            };

            function onClose() {
                writeLoggerMessage("info", "logger.push.close", "Logger " + stream + " closed");
                unsetLogger();
            }
        } else {
            writeLoggerMessage("warn", "logger.push.warn", ("Unsupported setLogger operation: " + err.message ), {options: options});
        }
    }
};

module.exports.getCount = function() {
    return gLogCount;
};

/**
 * Return one of the predefined logger classes. If you want to define your own class,
 * it is suggested you subclass the console logger class, just as file and SOS have done.
 * @returns {*} Logger Class for which you should call new with options, or subclass
 */
module.exports.getLoggerClass = function(type) {
    if( _.isString(type) ) {
        return require('./transports/' + type);
    }
};

module.exports.getCurrentLogger = function(type) {
    return aStreams[0];
};

var unsetLogger = function() {
    if( aStreams.length > 1 ) {
        var discardStream = aStreams.shift();
        discardStream.destroy();
        var stream = aStreams[0];
        writeLoggerMessage("info", "logger.pop", "Restoring previous " + stream + " logger", {stream: stream.toString()});
        aStreams[0].open(onSuccess, onError, onClose);

        function onSuccess() {
            writeLoggerMessage("info", "logger.pop.success", "Set logger to " + stream, {stream: stream.toString()});
        };

        function onError( err ) {
            writeLoggerMessage("warn", "logger.pop.warn", "Tried but failed to set logger to " + stream + ": " + err);
            unsetLogger();
        };

        function onClose() {
            writeLoggerMessage("info", "logger.pop.close", "Logger " + stream + " closed");
            unsetLogger();
        }
    } else {
        writeLoggerMessage("warn", "logger.pop.abort", "Aborting unsetLogger because no more loggers in stack");
    }
};

module.exports.unsetLogger = unsetLogger;



