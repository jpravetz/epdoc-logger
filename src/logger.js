/*****************************************************************************
 * logger.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

/**
 * Logging module. Shows time and log level (debug, info, warn, error).
 * Time is shown in milliseconds since this module was first initialized.
 * Usage:
 *        var log = require('../lib/logMgr').get('logtest');
 *        log.info( 'Message: %s', 'my message');
 */


var util = require('util');
var DateUtil = require('./dateutil');
var _ = require('underscore');

/**
 * Create a new log object with methods to log to the transport that is attached to logMgr.
 * This log object can be attached to another object, for example an express response object,
 * in order to next the log call and thereby carry context down thru the calling stack.
 * If a context is passed in, various properties may be harvested off of the req property. These
 * include: req._reqId (populates reqId column), req.sid?req.session.id|req.sessionId (populates
 * sid column), req._startTime and req._hrStartTime (can be used to determine response time for a
 * request).
 * @param logMgr {Logger} The parent LogManager object that specifies the transport and provides
 *   output methods
 * @param opt_modulename {string|Array} The name of the module, used to populate the module column
 *   of logMgr output. This can be modified to show the calling stack by calling pushRouteInfo and
 *   popRouteInfo.
 * @param opt_context {object} A context object. For Express or koa this would have 'req' and 'res'
 *   properties.
 * @constructor
 */
var Logger = function (logMgr, opt_modulename, opt_context) {

    // The common Logger object thru which output will be written
    this.logMgr = logMgr;

    // Displayed in some IDE debuggers to identify this object. No other use.
    this.name = "logMgr";

    // module column
    this.stack = [];
    if (_.isString(opt_modulename)) {
        this.name = opt_modulename + " " + this.name;
        this.stack = [opt_modulename];
    } else if (_.isArray(opt_modulename)) {
        this.name = opt_modulename.join('.') + " " + this.name;
        this.stack = opt_modulename;
    }

    // Contains Express and koa req and res properties
    // If ctx.req.sessionId, ctx.req.sid or ctx.req.session.id are set, these are used for sid
    // column. If ctx.req._reqId, this is used as reqId column
    this.ctx = opt_context;

    // Min log level required to create output, overrides logMgr.logLevel if set
    this.logLevel = logMgr.logLevel ? logMgr.logLevel : 'debug';


    this.logData;

    // action column
    this.action;
};

Logger.prototype = {

    constructor: Logger,

    setContext: function (ctx) {
        this.ctx = ctx;
        return this;
    },

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

    error: function (err) {
        if (err instanceof Error) {
            return this.logArgs('error', [err.message]);
        } else {
            return this.logArgs('error', Array.prototype.slice.call(arguments));
        }
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
            this.action = arguments[0].join('.');
        } else if (arguments.length > 1) {
            this.action = Array.prototype.join.call(arguments, '.');
        } else {
            this.action = arguments[0];
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
     * Set custom data that is output in a separate column called 'custom'.
     * This is currently only used with loggly.
     * @param key {String|object} If a string then sets custom.key = value, otherwise extends
     *   custom with key
     * @param value {*} (Optional) Set key to this value
     * @returns {Logger}
     */
    set: function (key, value) {
        if (!this.customData) {
            this.customData = {};
        }
        if (typeof key === 'string' || typeof key === 'number') {
            this.customData[key] = value;
        } else {
            this.customData = _.extend(this.customData, key);
        }
        return this;
    },

    /**
     * A method to add context to the method stack that has gotten us to this point in code.
     * The context is pushed into a stack, and the full stack is output as the 'module' property
     * of the log message. Usually called at the entry point of a function.
     * Can also be called by submodules, in which case the submodules should call popRouteInfo when
     * returning Note that it is not necessary to call popRouteInfo when terminating a request with
     * a response.
     * @param name (required) String in the form 'api.org.create' (route.method or
     *   route.object.method).
     * @return Response object
     */
    pushName: function (name) {
        this.stack.push(name);
        return this;
    },

    /**
     * See pushRouteInfo. Should be called if returning back up a function chain. Does not need to
     * be called if the function terminates the request with a response.
     * @param options Available options are 'all' if all action contexts are to be removed from the
     *   _logging stack.
     * @return Response object
     */
    popName: function (options) {
        if (options && options.all === true) {
            this.stack = [];
        } else {
            this.stack.pop();
        }
        return this;
    },

    getStack: function () {
        return this.stack;
    },

    /**
     * Used for requests.
     * The time used since this request object was initialized.
     * Requirement: request object must set it's _startTime for this to work.
     * @returns {number}
     */
    responseTime: function () {
        return (this.ctx && this.ctx.req && this.ctx.req._startTime) ? ( new Date() - this.ctx.req._startTime ) : 0;
    },

    logResponseTime: function (args) {
        var elapsed = this.responseTime();
        this.logObj('responseTime', elapsed);
        if (args) {
            return this.log.apply(this, Array.prototype.slice.call(arguments));
        }
        return this;
    },

    /**
     * Used for requests.
     * High resolution response time.
     * Returns the response time in milliseconds with two digits after the decimal.
     * @returns {number} Response time in milliseconds
     */
    hrResponseTime: function () {
        if (this.ctx && this.ctx.req && this.ctx.req._delayTime) {
            //var parts = process.hrtime(this.ctx.req._hrStartTime);
            return ( parts[0] * 100000 + Math.round(parts[1] / 10000) ) / 100;
        }
        return 0;
    },

    logHrResponseTime: function (args) {
        var elapsed = this.hrResponseTime();
        this.logObj('responseTime', elapsed);
        if (args) {
            return this.log.apply(this, Array.prototype.slice.call(arguments));
        }
        return this;
    },

    /**
     * Reset the elapsed time timer.
     */
    resetElapsed: function () {
        this.t0 = (new Date()).getTime();
        return this;
    },

    /**
     * Add an 'elapsed' attribute to data being output.
     * @returns {this}
     */
    elapsed: function () {
        var elapsed = (this.t0) ? ((new Date()).getTime() - this.t0) : 0;
        return this.logObj('elapsed', elapsed);
    },

    /**
     * Set a property in the data column, or set the value of the data object.
     * @param key {string|object} If a string then sets data[key] to value. Otherwise sets data to
     *   key.
     * @param value If key is a string then sets data[key] to this value.
     */
    data: function (key, value) {
        return this.logObj(key, value);
    },

    date: function (d, s) {
        if (this.isAboveLevel('info')) {
            d = d || new Date();
            this.action = s || 'currentTime';
            this.logObj({
                localtime: DateUtil.toISOLocalString(d),
                utctime: d.toISOString(),
                uptime: DateUtil.formatMS(d - this.logMgr.getStartTime())
            });
            this.logArgs('info', []);
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
     * Output a log message, specifying the log level as the first parameter, and a string
     * with util.format syntax as a second parameter,
     * for example myLogger.log('info', 'test message %s', 'my string');
     * The second parameter can optionally be an array of strings or arrays, each one of which
     * will be treated as input to util.format. This is useful for logMgrs that support
     * folding (muli-line output).
     * Example: log.log( 'info', [["Found %d lines", iLines],"My second line",["My %s
     * line",'third']]); );
     * @param level {string} One of Logger.LEVEL_ORDER. Defaults to info if not present.
     * @param msg The message String, or an array of strings, to be formatted with util.format.
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


    /**
     * Calls the logMgr interface to output the log message.
     * Rolls in all previous calls to set data and action, and resets those values.
     * @param level {string} Required
     * @param msg {array|string ...} Normally a string, providing the same string
     * interpolation format as util.format. May also be an array of strings,
     * in which case each entry in the array is treated as arguments to util.format.
     * This later situation is useful for logMgrs that support multi-line formatting.
     * @private
     */
    _writeMessage: function (level, msg) {
        var args = Array.prototype.slice.call(arguments);
        if (args.length > 1) {
            var params = {
                level: args.shift(),
                module: this.stack.join('.')
            };
            if (this.logData) {
                params.data = this.logData;
                delete this.logData;
            }
            if (this.customData) {
                params.custom = this.customData;
            }
            if (this.action) {
                params.action = this.action;
                delete this.action;
            }
            if (this.truncateLength) {
                params.length = this.truncateLength;
                delete this.truncateLength;
            }
            if (args.length === 1 && (args[0] instanceof Array)) {
                params.message = [];
                for (var idx = 0; idx < args[0].length; ++idx) {
                    params.message.push(util.format.apply(this, (args[0][idx] instanceof Array) ? args[0][idx] : [args[0][idx]]));
                }
            } else if (args && args.length) {
                if (typeof args[0] === 'string') {
                    params.message = util.format.apply(this, args);
                } else {
                    var arr = [];
                    args.forEach(function (arg) {
                        arr.push(JSON.stringify(arg));
                    });
                    params.message = arr.join(' ');
                }
            }
            if (this.ctx) {
                this.logParams(params);
            } else {
                this.logMgr.logParams(params);
            }
        }
    },

    /**
     * Log a raw message in the spirit of Logger.logMessage, adding sid and reqId columns from
     * this.ctx.req Looks for sessionID in req.session.id or req.sessionId, otherwise uses the
     * passed in values for sid and reqId (if any). This is the method that calls the underlying
     * logging outputter. If you want to use your own logging tool, you can replace this method, or
     * provide your own transport.
     * @param params
     * @return {*}
     */
    logParams: function (params) {
        if (this.ctx && this.ctx.req) {
            if (this.ctx.req._reqId) {
                params.reqId = this.ctx.req._reqId;
            }
            if (this.ctx.req.session && this.ctx.req.session.id) {
                params.sid = this.ctx.req.session.id;
            } else if (this.ctx.req.sessionId) {
                params.sid = this.ctx.req.sessionId;
            } else if (this.ctx.req.sid) {
                params.sid = this.ctx.req.sid;
            }
        }
        this.logMgr.logParams(params);
        return this;
    },

    setTruncate: function (len) {
        this.truncateLength = len;
        return this;
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
        var reference = this.logLevel || this.logMgr.logLevel;
        if (this.logMgr.LEVEL_ORDER.indexOf(level) >= this.logMgr.LEVEL_ORDER.indexOf(reference)) {
            return true;
        }
        return false;
    }
};

module.exports = Logger;



