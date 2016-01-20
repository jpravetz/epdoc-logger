/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
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

var util = require('util');
var DateUtil = require('./dateutil');

// Static containing the time that this module was first initialized.
// Modules are loaded only once, so this will only be set once.
var t0 = (new Date()).getTime();


var ModuleLogger = function (modulename,logger) {
    this.logger = logger;
    this.name = modulename + " logger";     // Displayed in some IDE debuggers to identify this object
    this.moduleName = modulename;
    this.logLevel;
    this.logData;
    this.logAction;
};

ModuleLogger.prototype = {

    constructor: ModuleLogger,


    /**
     * Log an info message. The message can contain arguments (e.g 'Hello %s', 'world')
     */
    info: function () {
        return this.logArgs('info', Array.prototype.slice.call(arguments));
    },

    warn: function () {
        return this.logArgs('warn', Array.prototype.slice.call(arguments));
    },

    debug: function () {
        return this.logArgs('debug', Array.prototype.slice.call(arguments));
    },

    verbose: function () {
        return this.logArgs('verbose', Array.prototype.slice.call(arguments));
    },

    error: function () {
        return this.logArgs('error', Array.prototype.slice.call(arguments));
    },

    fatal: function () {
        return this.logArgs('fatal', Array.prototype.slice.call(arguments));
    },

    separator: function () {
        if (this.isAboveLevel('info')) {
            this._writeMessage('info', "######################################################################");
        }
        return this;
    },

    /**
     * Action is a unique column in the log output and is a machine-searchable verb that uniquely
     * describes the type of log event.
     * @param arguments String or comma separated list of strings that are then joined with a '.'
     * @returns {*}
     */
    action: function () {
        if (arguments[0] instanceof Array) {
            this.logAction = arguments[0].join('.');
        } else if (arguments.length > 1) {
            this.logAction = Array.prototype.join.call(arguments, '.');
        } else {
            this.logAction = arguments[0];
        }
        return this;
    },

    /**
     * Log a key,value or an object. If an object the any previous logged objects
     * are overwritten. If a key,value then add to the existing logged object.
     * Objects are written when a call to info, etc is made
     * @param key If a string or number then key,value is added, else key is added
     * @param value If key is a string or number then data.key is set to value
     * @return The logging object, for chaining
     */
    logObj: function (key, value) {
        if (typeof key === 'string' || typeof key === 'number') {
            if (!this.logData) {
                this.logData = {};
            }
            this.logData[key] = value;
        } else {
            this.logData = key;
        }
        return this;
    },

    /**
     * Deprecated. Used error() instead.
     */
    logErr: function (err) {
        if (!this.logData) {
            this.logData = {};
        }
        this.logData.error = err;
        return this;
    },

    /**
     * Deprecated. Used logObj instead.
     */
    data: function (key, value) {
        return this.logObj(key, value);
    },

    date: function (d, s) {
        if (this.isAboveLevel('info')) {
            d = d || new Date();
            this.logAction = s || 'currentTime';
            this.logObj({
                localtime: DateUtil.toISOLocalString(d),
                utctime: d.toISOString(),
                uptime: DateUtil.formatMS(d - t0)
            });
            this.logArgs('info', []);
//			var logMsg = util.format( "[%s] INFO: %s - === CURRENT TIME  %s ====", DateUtil.formatMS(d.getTime()-t0,0), (moduleName ? this.moduleName : ""), DateUtil.toISOLocalString(d) );
//			writeMessage( logMsg );
        }
        return this;
    },

    // Helper, level must be set, args must be an array, but can be empty
    logArgs: function (level, args) {
        if (!args.length) {
            args.unshift('');
        } else if (args.length && ( args[0] === undefined || args[0] === null )) {
            args.shift();
        }
        args.unshift(level);
        return this.log.apply(this, args);
    },

    /**
     * Output a log message. This function is suitable for providing to classes that require logging callbacks.
     * It can also be used for multiline (folded) log messages.
     * Example: log.log( 'info', req, "Found %d lines", iLines );
     * @param level One of warn, debug, error or info. Defaults to info if not present.
     * @param object Optional object that has a callback gGetSessionIdCallback
     * @param msg The message String, or an array of strings. Will be formatted
     */
    log: function () {
        var args = Array.prototype.slice.call(arguments);
        if (args.length) {
            if (args.length === 1) {
                args.unshift('info');
            }
            if (this.isAboveLevel(args[0])) {
                this._writeMessage.apply(this, args);
            }
        }
        return this;
    },


    // Expects level, msg params
    _writeMessage: function (level, msg) {
        var args = Array.prototype.slice.call(arguments);
        if (args.length > 1) {
            var params = {module: this.moduleName};
            params.level = args.shift();
            if (this.logData) {
                params.data = this.logData;
                delete this.logData;
            }
            if (this.logAction) {
                params.action = this.logAction;
                delete this.logAction;
            }
            if (args.length === 1 && (args[0] instanceof Array)) {
                params.message = [];
                for (var idx = 0; idx < args[0].length; ++idx) {
                    params.message.push(util.format.apply(this, (args[0][idx] instanceof Array) ? args[0][idx] : [args[0][idx]]));
                }
            } else {
                params.message = util.format.apply(this, args);
            }
            this.logger.logParams(params);
        }
    },

    /**
     * Set the log level for this object. This overrides the global log level for this object.
     */
    setLogLevel: function (level) {
        this.logLevel = level;
        return this;
    },

    /**
     * Return true if the level is equal to or greater then the reference, or if reference is null
     */
    isAboveLevel: function (level) {
        var reference = this.logLevel || this.logger.logLevel;
        if (this.logger.LEVEL_ORDER.indexOf(level) >= this.logger.LEVEL_ORDER.indexOf(reference)) {
            return true;
        }
        return false;
    },

    /**
     * Tests for fatal or error conditions and exits the app if either is found.
     * @param options { warn: true } Set if we should exit on warnings as well.
     * @param callback Called if there are no fatal or error conditions.
     */
    exitOnError: function (options, callback) {
        if (this.logger.logCount.error || this.logger.logCount.fatal) {
            doExit();
        } else if (options.warn && this.logger.logCount.warn) {
            doExit();
        } else {
            this.action('exit').logObj('exit', 0).logObj('counts', this.logger.logCount).info();
            callback && callback();
        }

        function doExit() {
            this.action('exit').logObj('exit', 1).logObj('counts', this.logger.logCount).fatal();
            process.exit(1);
        }
    }


};

module.exports = ModuleLogger;



