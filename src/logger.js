/*****************************************************************************
 * logger.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var util = require('util');
var format = require('./format');
var moment = require('moment');
var _ = require('underscore');


/**
 * <p>Create a new log object with methods to log to the transport that is attached to
 * <code>logMgr</code>. This log object can be attached to another object, for example an
 * [Express]{@link http://expressjs.com/} request object, in order to pass the log object down
 * through a calling stack. If a context is passed in, various properties may be harvested off of
 * the req property. These include: req._reqId (populates reqId column), req.sid (uses
 * req.session.id or req.sessionId and populates sid column), req._startTime and req._hrStartTime
 * (either can be used to determine the response time for a request).
 *
 * @class A Logger object has methods to write log information to a specified transport.
 * The line below shows sample output when writting to the Console transport.
 *
 * <p><code>["00:03.767","INFO",0,"","main","app.initialized","We've initialized the
 * app",{"process":{"pid":12345}}]</code>
 *
 * <p>For the above output, time is since this module was first initialized and is shown in
 * milliseconds. This is followed by the log level, request ID, session ID, module/emitter name,
 * action, message and arbitrary data.
 *
 * <p>The format of the output is determined by the transport and it's settings.
 *
 * @example
 * // Create a new Logger object step by step
 * var EpdocLogger = require('epdoc-logger');
 * var LogManager = EpdocLogger.LogManager;
 * var Logger = EpdocLogger.Logger;
 * var logMgr = new LogManager();
 * var log = new Logger(gLogMgr,'logtest');
 *
 * @example
 * // Create a new Logger object the easy way using global LogManager.
 * var log = require('epdoc-logger').get('logtest');
 *
 *
 * @param  {LogManager} logMgr - The parent LogManager object that specifies the transport and
 *   provides lower-level output methods
 * @param [emitter] {string|string[]} The name of the module or emitter that is emitting the
 *   log message, used to populate the <code>emitter</code> output column. This can be modified to
 *   show method call hierarchy by calling <code>pushName</code> and <code>popName</code>.
 * @param [context] {object} A context object. For [Express]{@link http://expressjs.com/} or
 *   [koa]{@link http://koajs.com/} this would have <code>req</code> and <code>res</code>
 *   properties.
 * @constructor
 */
var Logger = function (logMgr, emitter, context) {

    // The common Logger object thru which output will be written
    this.logMgr = logMgr;

    // emitter column
    this.stack = [];
    if (_.isString(emitter)) {
        this.name = "Logger#" + emitter;
        this.stack = [emitter];
    } else if (_.isArray(emitter)) {
        this.name = "Logger#" + emitter.join('.');
        this.stack = emitter;
    }

    // Contains Express and koa req and res properties
    // If ctx.req.sessionId, ctx.req.sid or ctx.req.session.id are set, these are used for sid
    // column. If ctx.req._reqId, this is used as reqId column
    this.ctx = context;

    // Min log level required to create output, overrides logMgr.logLevel if set
    this.logLevel = logMgr.logLevel ? logMgr.logLevel : logMgr.LEVEL_DEFAULT;

    this.bErrorStack = logMgr.bErrorStack ? logMgr.bErrorStack : false;

    this.logData;

    // action column
    this.logAction;

    // Add log methods for every level supported. The log levels can be customized
    // by setting LogManager.LEVEL_ORDER.
    var self = this;

    var addLevelMethod = function (level) {
        /**
         * Log a message at one of the log levels. The message can contain arguments (e.g 'Hello
         * %s',
         * 'world') or an Error object.
         */
        return function (err) {
            if (err instanceof Error) {
                var msgs = format.errorToStringArray(err);
                if (self.bErrorStack && err.stack) {
                    var items = err.stack.split(/\n\s*/);
                    self.data({ error: { code: err.code, stack: items } });
                } else if (!_.isUndefined(err.code)) {
                    self.data({ error: { code: err.code } });
                }
                return self.logArgs(level, msgs);
            } else {
                return self.logArgs(level, Array.prototype.slice.call(arguments));
            }
        };
    };

    for (var idx = 0; idx < logMgr.LEVEL_ORDER.length; idx++) {
        var level = logMgr.LEVEL_ORDER[idx];
        self[level] = addLevelMethod(level);
    }

    // Set so these can be used internally
    this._info = this[this.logMgr.LEVEL_INFO];
};

Logger.prototype = {

    constructor: Logger,

    setContext: function (ctx) {
        this.ctx = ctx;
        return this;
    },

    /**
     * Set whether to log a stack for Error objects. If not set in the constructor, then inherits
     * this value from the LogManager.
     * @param [bShow=true] {boolean}
     * @returns {Logger}
     */
    errorStack: function (bShow) {
        this.bErrorStack = (bShow === false) ? false : true;
        return this;
    },

    /**
     * Log a separator line that contains a message with '#' characters.
     * @return {Logger}
     */
    separator: function (options) {
        if (this.isAboveLevel(this.logMgr.LEVEL_INFO)) {
            var sep = this.logMgr.sep || "######################################################################";
            this._writeMessage(this.logMgr.LEVEL_INFO, sep);
        }
        return this;
    },

    /**
     * Set the value of the action column. Action is a unique column in the log output and is a
     * machine-searchable verb that uniquely describes the type of log event.
     *
     * @example
     *      log.action('message.sent').info("Message has been sent");
     *
     * @param {...string} arguments - Single string or multiple strings that are then joined with a
     *   '.'.
     * @return {Logger} The Logger object
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
     * Objects are written when a call to info, etc is made.
     *
     * @deprecated Use ```data``` method instead.
     * @param key {string|number|object} If a string or number then key,value is added, else the
     *   object ```key``` is added
     * @param [value] If key is a string or number then data.key is set to value
     * @return {Logger}
     */
    logObj: function (key, value) {
        return this._setData('data', key, value);
    },

    /**
     * Set <i>static data</i> that is output in a separate column called <code>static</code>`.
     * This column must be specifically enabled via the LogManager constructor's
     * <code>static</code>
     * option. Static data is not cleared when a log message is written, and so persists for the
     * life of the log object.
     *
     * @param key {String|object} If a string then sets staticData.key = value, otherwise extends
     *   staticData with key
     * @param value {*} (Optional) Set key to this value
     * @return {Logger}
     */
    set: function (key, value) {
        return this._setData('staticData', key, value);
    },

    /**
     * Set a property or multiple properties in the <code>data</code> column.
     * @example
     * log.data('a',3).data('b',4).info();
     * log.data({a:3,b:4}).info();
     *
     * @param {string|object} key - If a string then sets <code>data[key]</code> to
     *   <code>value</code>. Otherwise extend the object <code>data</code> with the object
     *   <code>key</code>.
     * @param [value] {string} If key is a string then sets <code>data[key]</code> to this value.
     * @return {Logger}
     */
    data: function (key, value) {
        return this._setData('logData', key, value);
    },

    /**
     * Common method used by the {@link Logger#data} method.
     * @param field
     * @param key
     * @param value
     * @returns {Logger}
     * @private
     */
    _setData: function (field, key, value) {
        if (!this[field]) {
            this[field] = {};
        }
        if (typeof key === 'string' || typeof key === 'number') {
            this[field][key] = value;
        } else {
            this[field] = _.extend(this[field], key);
        }
        return this;
    },

    /**
     * A method to add context to the method stack that has gotten us to this point in code.
     * The context is pushed into a stack, and the full stack is output as the module/emitter
     * property of the log message.
     *
     * <p>This method is usually called at the entry point of a function. Can also be
     * called by submodules, in which case the submodules should call [popName]{@link
        * Logger#popName} when returning. Note that it is not necessary to call [popName]{@link
        * Logger#popName} when used in the context of an Express context and terminating a request
     * with a response.
     *
     * @param name (required) String in the form 'api.org.create' (route.method or
     *   route.object.method).
     * @return Response object
     * @see Logger#popName
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
     * @see Logger#pushName
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
     * Tell logger whether we want to log the json response that we may be sending via express.
     * This is only used in conjunction with reponse.js
     * @param v
     */
    // logResponse: function (v) {
    //     this.logResponse = (v === false) ? false : true;
    // },

    /**
     * Adds a 'key' (default key = 'elapsed') attribute to data column, which is the time
     * since the timer was reset. Must first call resetElapsed() to reset the timer, else the value
     * will be 0.
     * @param {string} [name='elapsed'] The timer name. This allows multiple timers to be run at
     *   the same time, or just use the default 'elapsed' timer.
     * @param {string} [key='elapsed'] The name of the attribute to add to the data column.
     * @return {Object} this
     */
    elapsed: function (name, key) {
        name || (name = 'elapsed');
        key || (key = 'elapsed');
        this.timer || (this.timer = {});
        return this._setData('logData', key, this.getElapsed(name));
    },

    /**
     * Get the number of milliseconds since resetElapsed() has been called. This can be used to
     * measure the duration of requests or other events that are made within the context of this
     * request, when used with expressjs.
     * @param {string} [name='elapsed'] Allows multiple timers to be run at the same time, or just
     *   use the default timer.
     */
    getElapsed: function (name) {
        name || (name = 'elapsed');
        this.timer || (this.timer = {});
        if (this.timer[name]) {
            return ((new Date()).getTime() - this.timer[name]);
        }
        return 0;
    },

    /**
     * Reset the elapsed time timer.
     * @param {string} [name='elapsed'] Allows multiple timers to be run at the same time, or just
     *   use the default timer.
     * @return {Logger} Self
     */
    resetElapsed: function (name) {
        name || (name = 'elapsed');
        this.timer || (this.timer = {});
        this.timer[name] = (new Date()).getTime();
        return this;
    },

    /**
     * Adds the High Resolution response time to the data column. This value is measured from when
     * the request is received. It is added to the request object by the reqId middleware module.
     * @param {string} [key=elapsed] Name of property in the data column.
     * @return {Logger} Self.
     */
    hrElapsed: function (key) {
        return this._setData('logData', key || 'elapsed', this.getHrElapsed());
    },

    /**
     * High resolution response time. This value is measured from when the request is received.
     * Returns the response time in milliseconds with two digits after the decimal.
     * @return {number} Response time in milliseconds
     */
    getHrElapsed: function () {
        if (this.ctx) {
            var val;
            if (this.ctx._hrStartTime) {
                val = this.ctx._hrStartTime;
            } else if (this.ctx && this.ctx.state && this.ctx.state.hrStartTime) {
                val = this.ctx.state.hrStartTime;
            } else if (this.ctx.req && this.ctx.req._hrStartTime) {
                val = this.ctx.req._hrStartTime;
            }
            if (val) {
                var parts = process.hrtime(val);
                return ( parts[0] * 100000 + Math.round(parts[1] / 10000) ) / 100;
            }
        }
        return 0;
    },

    date: function (d, s) {
        if (this.isAboveLevel(this.logMgr.LEVEL_INFO)) {
            d || ( d = new Date() );
            this.logAction = s || 'currentTime';
            this.data({
                localtime: moment(d).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                utctime: d.toISOString(),
                uptime: format.formatMS(d - this.logMgr.getStartTime())
            });
            this.logArgs(this.logMgr.LEVEL_INFO, []);
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
     * @param {string} [level=info] - One of Logger.LEVEL_ORDER. Defaults to `info` if not present.
     * @param {string} msg - The message String, or an array of strings, to be formatted with
     *   util.format.
     */
    log: function (level, msg) {
        var args = Array.prototype.slice.call(arguments);
        if (args.length) {
            if (args.length === 1) {
                args.unshift(this.logMgr.LEVEL_INFO);
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
     * @param {string} level - Must be one of LogManager.LEVEL_ORDER
     * @param {(...string|...string[])} msg - Normally a string, providing the same string
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
                emitter: this.stack.join('.')
            };
            if (this.logData) {
                params.data = this.logData;
                delete this.logData;
            }
            if (this.staticData) {
                params.static = this.staticData;
            }
            if (this.logAction) {
                params.action = this.logAction;
                delete this.logAction;
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
                if (this.silent !== true) {
                    this.logMgr.logParams(params, this.logLevel);
                }
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

        function setParams (ctx) {
            if (ctx._reqId) {
                params.reqId = ctx._reqId;
            } else if (ctx.reqId) {
                params.reqId = ctx.reqId;
            }
            if (ctx.session && ctx.session.id) {
                params.sid = ctx.session.id;
            } else if (ctx.sessionId) {
                params.sid = ctx.sessionId;
            } else if (ctx.sid) {
                params.sid = ctx.sid;
            }
        }

        if (this.ctx) {
            if (this.ctx.state && this.ctx.app) {
                // Attempt to determine if this is a koa context
                setParams(this.ctx);
            } else if (this.ctx.req) {
                // Must be an express context
                setParams(this.ctx.req);
            } else {
                setParams(this.ctx);
            }
        }
        if (this.silent !== true) {
            this.logMgr.logParams(params, this.logLevel);
        }
        return this;
    },

    setTruncate: function (len) {
        this.truncateLength = len;
        return this;
    },

    /**
     * Set the log level for this object. This overrides the global log level for this object.
     * @param {string} level - Must be one of LogManager.LEVEL_ORDER.
     * @return {Logger} Self
     */
    setLevel: function (level) {
        this.logLevel = level;
        return this;
    },

    /**
     * Get the log level for this object
     * @returns {string} The currently set log level for this Logger object.
     */
    getLevel: function () {
        return this.logLevel;
    },

    /**
     * Test if the given level is above the log level set for this Logger object.
     * @param {string} level - Must be one of LogManager.LEVEL_ORDER.
     * @return {boolean} True if the level is equal to or greater then the reference, or if
     *   reference is null.
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
