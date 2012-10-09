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

// Static containing the time that this module was first initialized.
// Modules are loaded only once, so this will only be set once.
var t0 = (new Date()).getTime();

// Static containing stream where output should be written
var oStream = null;

// Log level
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
		var d = new Date();
		if( this.isAboveLevel('info') ) {
			var logMsg = util.format( "[%s] INFO: %s - === CURRENT TIME  %s ====", DateUtil.formatMS(d.getTime()-t0,0), (this.moduleName ? this.moduleName : ""), DateUtil.toISOLocalString(d) );
			writeMessage( logMsg );
		}
	};
	
	/**
	 * Output a log message. This function is suitable for providing to classes that require logging callbacks.
	 * @param level One of warn, debug, error or info
	 * @param msg The message. Cannot contain arguments.
	 */
	this.log = function( level, msg ) {
		if( this.isAboveLevel(level) ) {
			var logMsg = util.format( "[%s] %s: %s - %s", _timeDiff(), String(level).toUpperCase(), (this.moduleName ? this.moduleName : ""), msg );
			writeMessage( logMsg );
		}
		return this;
	};
	
	function writeMessage( msg ) {
		if( oStream ) {
			oStream.write( msg + "\n" );
		} else {
			console.log( msg );
		};
	}
	
	this.setWritePath = function( path ) {
		var FS = require('fs');
		oStream = FS.createWriteStream( path, { flags: 'a' } );
		return this;
	};

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

	function _timeDiff() {
		var tdiff = (new Date()).getTime() - t0;
		return DateUtil.formatMS( tdiff, 0 );
	}
	
	/**
	 * Shortcut to util.format()
	 */
	this.format = function() {
		return util.format.apply(this,arguments);
	};

};


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
