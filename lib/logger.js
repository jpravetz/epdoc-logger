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
 * 		var log = require('../lib/logger').NewLogger('logtest');
 *		log.info( 'Message: %s', 'my message');
 */

const LEVEL_ORDER = [ 'verbose', 'debug', 'info', 'warn', 'error' ];

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


var Logger = function (name) {
	
	this.moduleName = name;
	this.logLevel;

	/**
	 * Log an info message. The message can contain arguments (e.g 'Hello %s', 'world')
	 */
	this.info = function() {
		return this.log( 'info', util.format.apply(this,arguments));
	};
	
	this.warn = function() {
		return this.log( 'warn', util.format.apply(this,arguments));
	};
	
	this.debug = function() {
		return this.log( 'debug', util.format.apply(this,arguments));
	};
	
	this.verbose = function() {
		return this.log( 'verbose', util.format.apply(this,arguments));
	};
	
	this.error = function() {
		return this.log( 'error', util.format.apply(this,arguments));
	};
	
	this.date = function() {
		if( this.isAboveLevel('info') ) {
            var d = new Date();
            var msg = util.format( "=== CURRENT TIME  %s ====", DateUtil.toISOLocalString(d) );
            this._writeMessage( 'info', msg );
//			var logMsg = util.format( "[%s] INFO: %s - === CURRENT TIME  %s ====", DateUtil.formatMS(d.getTime()-t0,0), (this.moduleName ? this.moduleName : ""), DateUtil.toISOLocalString(d) );
//			writeMessage( logMsg );
		}
        return this;
	};

	/**
	 * Output a log message. This function is suitable for providing to classes that require logging callbacks.
     * It can also be used for multiline (folded) log messages
	 * @param level One of warn, debug, error or info. Defaults to info if not present.
	 * @param msg The message String, or an array of strings. Cannot contain arguments.
	 */
	this.log = function( level, msg ) {
        if( !msg ) {
            msg = level;
            level = 'info';
        }
		if( this.isAboveLevel(level) ) {
            this._writeMessage( level, msg );
//			var logMsg = util.format( "[%s] %s: %s - %s", _timeDiff(), String(level).toUpperCase(), (this.moduleName ? this.moduleName : ""), msg );
//			writeMessage( logMsg );
		}
		return this;
	};

    this._writeMessage = function( level, msg ) {
        var params = { module: this.moduleName, level: level, msg: msg, timeDiff: timeDiff() };
        writeMessageParams( params );
    };


//	this.setWritePath = function( path ) {
//		var FS = require('fs');
//		oStream = FS.createWriteStream( path, { flags: 'a' } );
//		return this;
//	};

	// Not called. Placeholder in case we ever support managed shutdown
	this.destroy = function() {
		if( oStream ) {
			oStream.end();
			oStream.destroy();
		}
	};

	this.getTime = function() {
		return t0;
	};
	
	/**
	 * Set the log level for this object. This overrides the global log level for this object.
	 */
	this.setLogLevel = function(level) {
		this.logLevel = level;
		return this;
	}
	
	/**
	 * Return true if the level is equal to or greater then the reference, or if reference is null
	 */
	this.isAboveLevel = function( level ) {
		var reference = this.logLevel || gLogLevel;
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

function timeDiff() {
    return (new Date()).getTime() - t0;
}

/**
 * Return an instance of the logger that has the module name set.
 */
exports.get = function(moduleName) {
	return new Logger(moduleName);
};

/**
 * Set log level globally
 */
exports.setGlobalLogLevel = function(level) {
    gLogLevel = level;
};

/**
 * Write the message. We queue messages to handle the moment in time while we are switching
 * streams and the new stream is not ready yet. We do queuing while we wait for it to be ready.
 * @param msgParams
 */
function writeMessageParams( msgParams ) {
    if( msgParams )
        queue.push( msgParams );
    if( oStream.ready ) {
        if( nextMsg = queue.shift() ) {
            oStream.write( nextMsg );
            writeMessageParams();
        }
    }
};


/**
 * Set log target. Defaults to console.
 * @param name Name of log target. Currently supports the following targets: [ 'sos' ]
 */
exports.setLogger = function( name ) {
    if( name === 'sos' && oStream.type !== 'sos' ) {
        var SOS = require('./sos');
        var oldStream = oStream;
        writeMessage( "Setting logger to SOS" );
        oStream = new SOS();
        oStream.open( onSuccess, onError, onClose );

        function onSuccess() {
            oStream.clear();
            writeMessage( "Set logger to SOS" );
        };

        function onError() {
            restoreOldStream( "Tried but failed to set logger to SOS" );
        };

        function onClose() {
            restoreOldStream( "SOS logger closed" );
        }

        function restoreOldStream( msg ) {
            if( oldStream ) {
                msg += "; restoring " + oldStream.type + " logger";
                oStream = oldStream;
                oldStream = null;
            }
            writeMessage( msg );
        }
    }

    function writeMessage( msg ) {
        var params = { module: 'logger', level: 'info', timeDiff: timeDiff(), msg: msg };
        writeMessageParams( params );
    }
};


