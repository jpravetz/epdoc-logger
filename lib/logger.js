/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2012 Armor5, Inc. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property
 * of Armor5, Inc. and its suppliers, if any. The intellectual and 
 * technical concepts contained herein are proprietary to Armor5, Inc.  
 * and its suppliers and may be covered by U.S. and Foreign Patents,  
 * patents in process, and are protected by trade secret or copyright law. 
 * Dissemination of this information or reproduction of this material is 
 * strictly forbidden unless prior written permission is obtained from 
 * Armor5, Inc..
 **************************************************************************/

/**
 * Logging module. Shows time and log level (debug, info, warn, error).
 * Time is shown in milliseconds since this module was first initialized.
 * Usage:
 * 		var log = require('../lib/logger').get('logtest');
 *		log.info( 'Message: %s', 'my message');
 */

const LEVEL_ORDER = [ 'verbose', 'debug', 'info', 'warn', 'error', 'fatal' ];
const DEFAULT_BUFFER_DURATION = 1000; // ms

var util = require('util');
var DateUtil = require('./dateutil');
var ConsoleStream = require('./console');

// Static containing the time that this module was first initialized.
// Modules are loaded only once, so this will only be set once.
var t0 = (new Date()).getTime();

// Static stack containing stream where output should be written
var aStreams = [ new ConsoleStream() ];

// Static global holds a queue of messages that may build up while we are switching streams
// Streams do their own buffering to their own output
var queue = [];

// Static buffer duration
var gBufferDuration = DEFAULT_BUFFER_DURATION;

// Static global log level
var gLogLevel = 'debug';

// Static custom callback to use if an object is passed in as first parameter of log method
// var gGetSessionIdCallback;


var Logger = function (modulename) {

    var self = this;
	this.moduleName = modulename;
	this.logLevel;
    this.logData;
    this.logAction;

    /**
	 * Log an info message. The message can contain arguments (e.g 'Hello %s', 'world')
	 */
	this.info = function() {
        return self.logArgs( 'info', Array.prototype.slice.call(arguments) );
	};

	this.warn = function() {
        return self.logArgs( 'warn', Array.prototype.slice.call(arguments) );
	};
	
	this.debug = function() {
        return self.logArgs( 'debug', Array.prototype.slice.call(arguments) );
	};
	
	this.verbose = function() {
        return self.logArgs( 'verbose', Array.prototype.slice.call(arguments) );
	};

    this.error = function() {
        return self.logArgs( 'error', Array.prototype.slice.call(arguments) );
    };

    this.fatal = function() {
        return self.logArgs( 'fatal', Array.prototype.slice.call(arguments) );
    };

    this.separator = function() {
        if( self.isAboveLevel('info') ) {
            self._writeMessage( 'info', "######################################################################" );
        }
        return this;
    };

    this.data = function(key,value) {
        if( value && (typeof key === 'string' || typeof key === 'number') ) {
            if( !self.logData)
                self.logData = {};
            self.logData[key] = value;
        } else {
            self.logData = key;
        }
        return self;
    };

    this.date = function() {
        if( self.isAboveLevel('info') ) {
            var d = new Date();
            self.data( 'localtime', DateUtil.toISOLocalString(d) );
            self.data( 'utctime', d.toISOString() );
            //var msg = util.format( "=== CURRENT TIME  %s ====", DateUtil.toISOLocalString(d) );
            self.logArgs( 'info', [] );
//			var logMsg = util.format( "[%s] INFO: %s - === CURRENT TIME  %s ====", DateUtil.formatMS(d.getTime()-t0,0), (this.moduleName ? this.moduleName : ""), DateUtil.toISOLocalString(d) );
//			writeMessage( logMsg );
        }
        return self;
    };

    // Helper, level must be set, args must be an array, but can be empty
    this.logArgs = function( level, args ) {
        if( !args.length )
            args.unshift('');
        else if( args.length && ( args[0] === undefined || args[0] === null ) )
            args.shift();
        args.unshift( level );
        return self.log.apply( this, args );
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
            if( args.length === 1 )
                args.unshift( 'info' );
            if( self.isAboveLevel(args[0]) )
                self._writeMessage.apply( this, args );
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
            var params = { module: self.moduleName };
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
                for( var idx=0; idx<args[0].length; ++idx ) {
                    params.message.push( util.format.apply(this, (args[0][idx] instanceof Array) ? args[0][idx] : [args[0][idx]] ) );
                }
            } else {
                params.message = util.format.apply( this, args );
            }
            writeMessageParams( params );
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
	this.setLogLevel = function(level) {
		self.logLevel = level;
		return this;
	}
	
	/**
	 * Return true if the level is equal to or greater then the reference, or if reference is null
	 */
	this.isAboveLevel = function( level ) {
		var reference = self.logLevel || gLogLevel;
		if( LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(reference) )
			return true;
		return false;
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
    return util.format.apply(this,arguments);
};



/**
 * Return an instance of the logger that has the module name set.
 */
module.exports.get = function(moduleName) {
	return new Logger(moduleName);
};

/**
 * Set log level globally
 */
module.exports.setGlobalLogLevel = function(level) {
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
        if( !msgParams.level )
            msgParams.level = 'info';
        if( gIsAboveLevel(msgParams.level) ) {
            if( !msgParams.time )
                msgParams.time = new Date();
            if( !msgParams.timeDiff )
                msgParams.timeDiff = msgParams.time.getTime() - t0;
            queue.push( msgParams );
        }
        if( msgParams.length && msgParams.message && msgParams.message.length > msgParams.length )
            msgParams.message = msgParams.message.substr(0,msgParams.length) + "...";
    }
    flushQueue();
};

/**
 * Return true if the level is equal to or greater then the globally set log level
 */
function gIsAboveLevel( level ) {
    if( LEVEL_ORDER.indexOf(level) >= LEVEL_ORDER.indexOf(gLogLevel) )
        return true;
    return false;
};


function flushQueue() {
    if( aStreams[0].ready ) {
        var nextMsg = queue.shift();
        if( nextMsg ) {
            aStreams[0].write( nextMsg );
            flushQueue();
        }
    }
}

function writeLoggerMessage( level, msg, data ) {
    var params = { module: 'logger', level: level, message: msg };
    if( data )
        params.data = data;
    writeMessageParams( params );
}



/**
 * Set log target by pushing the logger onto the stack of loggers. Defaults to console.
 * @param name Name of log target. Currently supports the following targets: [ 'sos' ]
 * @param options contains:
 *      type - one of 'sos', 'file', or 'console'
 *      path - path to file, for type file
 *      bIncludeSessionId - whether to include sessionId
 *      dateFormat - one of 'ISO' for 'formatMS'
 */
module.exports.setLogger = function( options ) {

    var bValid = false;
    if( options && options.type === 'sos' && aStreams[0].type !== 'sos' )
        bValid = true;
    else if( options && options.type === 'file' && aStreams[0].type !== 'sos' && options.path )
        bValid = true;
    else if( options && options.type === 'console' )
        bValid = true;

    if( bValid ) {
        var Logger = require('./' + options.type );
        var stream = new Logger( options );
        writeLoggerMessage( "info", "Setting logger to " + stream );
        aStreams[0].end();
        aStreams.unshift( stream );
        stream.open( onSuccess, onError, onClose );

        function onSuccess() {
            stream.clear();
            writeLoggerMessage( "info", "Set logger to " + stream );
        };

        function onError(err) {
            writeLoggerMessage( "Tried but failed to set logger to " + stream + ": " + err );
            popLogger();
        };

        function onClose() {
            writeLoggerMessage( "Logger " + stream + " closed" );
            popLogger();
        }

    } else {
        writeLoggerMessage( "error", ("Unsupported setLogger operation when current logger is " + aStreams[0].type), { options: options } );
    }
};

module.exports.getLogger = function() {
    return aStreams[0];
};

module.exports.popLogger = popLogger;
var popLogger = function() {

    if( aStreams.length > 1 ) {
        var discardStream = aStreams.shift();
        discardStream.destroy();
        var stream = aStreams[0];
        writeLoggerMessage( "info", "Restoring previous " + stream + " logger" );
        aStreams[0].open( onSuccess, onError, onClose );

        function onSuccess() {
            writeLoggerMessage( "info", "Set logger to " + stream );
        };

        function onError(err) {
            writeLoggerMessage( "Tried but failed to set logger to " + stream + ": " + err );
            popLogger();
        };

        function onClose() {
            writeLoggerMessage( "Logger " + stream + " closed" );
            popLogger();
        }
    } else {
        writeLoggerMessage( "warn", "Aborting popLogger because no more loggers in stack" );
    }

};



