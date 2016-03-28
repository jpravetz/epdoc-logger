// logger.js
// CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.


var util = require('util');
var DateUtil = require('./dateutil');
var moment = require('moment');
var _ = require('underscore');

/**
 * Logging module. Shows time and log level (debug, info, warn, error).
 * Time is shown in milliseconds since this module was first initialized.
 *
 * Create a new log object with methods to log to the transport that is attached to `logMgr`.
 * This log object can be attached to another object, for example an express response object,
 * in order to next the log call and thereby carry context down thru the calling stack.
 * If a context is passed in, various properties may be harvested off of the req property. These
 * include: req._reqId (populates reqId column), req.sid?req.session.id|req.sessionId (populates
 * sid column), req._startTime and req._hrStartTime (can be used to determine response time for a
 * request).
 *
 * @example
 *        var log = require('epdoc-logger').get('logtest');
 *        log.info( 'Message: %s', 'my message');
 *
 * @class Logger
 * @param  {LogManager} logMgr - The parent LogManager object that specifies the transport and
 *   provides lower-level output methods
 * @param [modulename] {string|string[]} The name of the module or emitter that is emitting the
 *   log message, used to populate the module column of logMgr output. This can be modified to show
 *   the calling stack by calling pushName and popName.
 * @param [context] {object} A context object. For [Express](http://expressjs.com/) or
 *   [koa](http://koajs.com/) this would have ```req``` and ```res``` properties.
 * @constructor
 */
var Logger = function (logMgr, modulename, context) {

    // The common Logger object thru which output will be written
    this.logMgr = logMgr;

    // module column
    this.stack = [];
    if (_.isString(modulename)) {
        this.name = modulename + " " + this.name;
        this.stack = [modulename];
    } else if (_.isArray(modulename)) {
        this.name = modulename.join('.') + " " + this.name;
        this.stack = modulename;
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
                var msgs = [err.message];
                if (_.isArray(err.errors)) {
                    for (var idx = 0; idx < err.errors.length; ++idx) {
                        msgs.push(err.errors[idx]);
                    }
                }
                if (self.errorStack() && err.stack) {
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
    }

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

    errorStack: function (bShow) {
        this.bErrorStack = (bShow === false) ? false : true;
        return this;
    },

    /**
     * Log a separator line that contains a message with '#' characters.
     * @returns {Logger}
     */
    separator: function () {
        if (this.isAboveLevel(this.logMgr.LEVEL_INFO)) {
            this._writeMessage(this.logMgr.LEVEL_INFO, "######################################################################");
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
     * @return {*}
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
     * Set <i>custom data</i> that is output in a separate column called ```custom```.
     * This column must be specifically enabled via the LogManager constructor's ```custom```
     * option.
     *
     * @param key {String|object} If a string then sets custom.key = value, otherwise extends
     *   custom with key
     * @param value {*} (Optional) Set key to this value
     * @return {Logger}
     */
    set: function (key, value) {
        return this._setData('customData', key, value);
    },

    /**
     * Set a property in the ```data``` column.
     * @param {string|object} key - If a string then sets ```data[key]``` to ```value```. Otherwise
     *   extend the object ```data``` the object ```key```.
     * @param [value] {string} If key is a string then sets data[key] to this value.
     * @return {Logger}
     */
    data: function (key, value) {
        return this._setData('logData', key, value);
    },

    /**
     * Set a property in the log data column, or set the value of the log data object.
     * Also sets the response data with the same value. This is used if you are using express
     * middleware, to set data that will be logged for the response (not sent with the reponse).
     * By using this method you can set data that is used in res.send() and in logging.
     * @method resData
     * @param key {string|object} If a string then sets data[key] to value. Otherwise sets data to
     *   key.
     * @param value If key is a string then sets data[key] to this value.
     * @deprecated
     * @return {Logger}
     */
    resData: function (key, value) {
        return this._setData('data', key, value)._setData('resData', key, value);
    },

    /**
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
     * Tell logger whether we want to log the json response that we may be sending via express.
     * This is only used in conjunction with reponse.js
     * @param v
     */
    // logResponse: function (v) {
    //     this.logResponse = (v === false) ? false : true;
    // },

    /**
     * Used to measure the duration of requests or other events.
     * Add an 'elapsed' attribute to data being output, which is the time
     * since this request object was initialized.
     * Requirement: One of the following three must be initialized:
     *      1. request object must set it's _delayTime
     *      2. request object must set it's _startTime (ms)
     *      3. must have called resetElapsed() to reset this.t0
     * @return {Object} this
     */
    elapsed: function (key) {
        return this._setData('logData', key || 'elapsed', this.getElapsed());
    },

    getElapsed: function () {
        if (this.ctx && this.ctx.req && this.ctx.req._delayTime) {
            return ( parts[0] * 100000 + Math.round(parts[1] / 10000) ) / 100;
        } else if (this.ctx && this.ctx.req && this.ctx.req._startTime) {
            return (new Date()).getTime() - this.ctx.req._startTime;
        } else if (this.t0) {
            return ((new Date()).getTime() - this.t0)
        }
        return 0;
    },

    /**
     * Adds the High Resolution response time to the data column.
     * @param {string} [key=elapsed] Name of property in the data column.
     * @return {Logger} Self.
     */
    hrElapsed: function (key) {
        return this._setData('logData', key || 'elapsed', this.getHrElapsed());
    },

    /**
     * High resolution response time.
     * Returns the response time in milliseconds with two digits after the decimal.
     * @return {number} Response time in milliseconds
     */
    getHrElapsed: function () {
        if (this.ctx && this.ctx.req && this.ctx.req._hrStartTime) {
            var parts = process.hrtime(this.ctx.req._hrStartTime);
            return ( parts[0] * 100000 + Math.round(parts[1] / 10000) ) / 100;
        }
        return 0;
    },


    /**
     * Reset the elapsed time timer.
     * @return {Logger} Self
     */
    resetElapsed: function () {
        this.t0 = (new Date()).getTime();
        return this;
    },

    date: function (d, s) {
        if (this.isAboveLevel(this.logMgr.LEVEL_INFO)) {
            d || ( d = new Date() );
            this.logAction = s || 'currentTime';
            this.data({
                localtime: moment(d).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
                utctime: d.toISOString(),
                uptime: DateUtil.formatMS(d - this.logMgr.getStartTime())
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
                module: this.stack.join('.')
            };
            if (this.logData) {
                params.data = this.logData;
                delete this.logData;
            }
            if (this.customData) {
                params.custom = this.customData;
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
                this.logMgr.logParams(params, this.logLevel);
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
        this.logMgr.logParams(params, this.logLevel);
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
