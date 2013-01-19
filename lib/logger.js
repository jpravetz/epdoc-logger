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

var util = require('util');
var DateUtil = require('./dateutil');
var ConsoleStream = require('./console');

// Static containing the time that this module was first initialized.
// Modules are loaded only once, so this will only be set once.
var t0 = (new Date()).getTime();

// Static containing stream where output should be written
var oStream = new ConsoleStream();


// Static global holds a queue of messages that may build up while we are switching oStreams
var queue = [];

// Static global log level
var gLogLevel = 'debug';

// Static custom callback to use if an object is passed in as first parameter of log method
var gGetSessionIdCallback;


var Logger = function (name) {

    var self = this;
	this.moduleName = name;
	this.logLevel;

    /**
     * Format the string. This is equivalent to util.format.
     */
    this.format = function() {
        return util.format.apply(this,arguments);
    };

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

    this.date = function() {
        if( self.isAboveLevel('info') ) {
            var d = new Date();
            var msg = util.format( "=== CURRENT TIME  %s ====", DateUtil.toISOLocalString(d) );
            self._writeMessage( 'info', msg );
//			var logMsg = util.format( "[%s] INFO: %s - === CURRENT TIME  %s ====", DateUtil.formatMS(d.getTime()-t0,0), (this.moduleName ? this.moduleName : ""), DateUtil.toISOLocalString(d) );
//			writeMessage( logMsg );
        }
        return this;
    };

    // Helper
    this.logArgs = function( level, args ) {
        if( args.length && ( args[0] === undefined || args[0] === null ) )
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
		return this;
	};

    this.hasSessionObjAsNthEntry = function(args,index) {
        if( index === undefined )
            index = 0;
        if( gGetSessionIdCallback && args.length > 1 && (typeof args[index] === 'object') && ( typeof args[index][gGetSessionIdCallback] === 'function') )
            return true;
        return false;
    };

    // Expects level, msg params
    this._writeMessage = function( level, msg ) {
        var args = Array.prototype.slice.call(arguments);
        if( args.length > 1 ) {
            var tnow = new Date();
            var params = { module: self.moduleName, time: tnow, timeDiff: (tnow.getTime()-t0) };
            params.level = args.shift();
            if( self.hasSessionObjAsNthEntry(args) ) {
                var obj = args.shift();
                params.sessionId = obj[gGetSessionIdCallback]();
            }
            if( args.length === 1 && (args[0] instanceof Array) ) {
                params.msg = [];
                for( var idx=0; idx<args[0].length; ++idx ) {
                    params.msg.push( util.format.apply(this, (args[0][idx] instanceof Array) ? args[0][idx] : [args[0][idx]] ) );
                }
            } else {
                params.msg = util.format.apply( this, args );
            }
            writeMessageParams( params );
        }
    };

	// Not called. Placeholder in case we ever support managed shutdown
	this.destroy = function() {
		if( oStream ) {
			oStream.end();
			oStream.destroy();
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

	/**
	 * Shortcut to util.format()
	 */
	this.format = function() {
		return util.format.apply(this,arguments);
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
module.exports.setSessionIdCallback = function( fnName ) {
    gGetSessionIdCallback = fnName;
}


/**
 * Write the message. We queue messages to handle the moment in time while we are switching
 * streams and the new stream is not ready yet. We do queuing while we wait for it to be ready.
 * @param msgParams
 */
function writeMessageParams( msgParams ) {
    if( msgParams )
        queue.push( msgParams );
    if( oStream.ready ) {
        var nextMsg = queue.shift();
        if( nextMsg ) {
            oStream.write( nextMsg );
            writeMessageParams();
        }
    }
};

/**
 * Set log target. Defaults to console.
 * @param name Name of log target. Currently supports the following targets: [ 'sos' ]
 */
module.exports.setLogger = function( name, options ) {
    var bValid = false;
    if( name === 'sos' && oStream.type !== 'sos' )
        bValid = true;
    else if( name === 'file' && oStream.type !== 'sos' && options && options.path )
        bValid = true;

    if( bValid ) {
        var Logger = require('./'+name);
        var oldStream = oStream;
        writeMessage( "info", "Setting logger to " + name );
        oStream = new Logger();
        oStream.open( options, onSuccess, onError, onClose );

        function onSuccess() {
            oStream.clear();
            writeMessage( "info", "Set logger to " + oStream );
        };

        function onError(err) {
            restoreOldStream( "Tried but failed to set logger to " + oStream + ": " + err );
        };

        function onClose() {
            restoreOldStream( "Logger " + oStream + " closed" );
        }

    } else {
        writeMessage( "error", "Unsupported setLogger operation " + name + ( options ? (" " + JSON.stringify(options)) : "" )
            + " when current logger is " + oStream.type );
    }

    function writeMessage( level, msg ) {
        var tnow = new Date();
        var params = { module: 'logger', level: level, time: tnow, timeDiff: (tnow.getTime()-t0), msg: msg };
        writeMessageParams( params );
    }

    function restoreOldStream( msg ) {
        if( oldStream ) {
            msg += "; restoring " + oldStream.type + " logger";
            oStream = oldStream;
            oldStream = null;
        }
        writeMessage( "info", msg );
    }
};

module.exports.getLogger = function() {
    return oStream;
};



