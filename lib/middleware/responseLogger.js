/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
_u = require('underscore');
var Logger = require('../logger');
var DateUtil = require('../dateutil');

/**
 * Middleware extends express.js response object, to be used for logging and responding to API calls.
 * This middleware creates a new ResponseLogger object with attached methods, then adds these methods
 * to the Express response object.
 */


/**
 * Our mixins that we add to the response object.
 */
var ResponseLogger = {

    /**
     * Replace express's res.send() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's send to finish the job.
     * @returns this
     */
    send: function () {
        var self = this;
        this.action('respond.send')
            .logObj('status', self.statusCode)
            .logObj('responseTime', self.hrResponseTime());
        if (this.req._delayTime) {
            this.logObj('delay', self.req._delayTime);
        }
        this.info();
        return self.super_.apply(this, arguments);
    },

    /**
     * The time used since this res object was initialized by Express.
     * @returns {number}
     */
    responseTime: function () {
        return this.req._startTime ? ( new Date() - this.req._startTime ) : 0;
    },

    /**
     * Returns the response time in milliseconds with two digits after the decimal.
     * @returns {number} Response time in milliseconds
     */
    hrResponseTime: function () {
        if (this.req._hrStartTime) {
            var parts = process.hrtime(this.req._hrStartTime);
            return ( parts[0] * 100000 + Math.round(parts[1] / 10000) ) / 100;
            // return (((parts[0]*1000)+(parts[1]/1000000))%10000); //.toFixed(2);
        }
        return 0;
    },



    /**
     * A method to add context to the method stack that has gotten us to this point in code.
     * The context is pushed into a stack, and the full stack is output as the 'module' property
     * of the log message.
     * Usually called at the entry point of a function.
     * Can also be called by submodules, in which case the submodules should call popRouteInfo when returning
     * Note that it is not necessary to call popRouteInfo when terminating a request with a response.
     * @param name (required) String in the form 'api.org.create' (route.method or route.object.method).
     * @return Response object
     */
    pushRouteInfo: function (name) {
        this.logging.stack.push(name);
        return this;
    },

    /**
     * See pushRouteInfo
     * @param options Available options are 'all' if all action contexts are to be removed from the logging stack.
     * @return Response object
     */
    popRouteInfo: function (options) {
        if( options && options.all === true) {
            this.logging.stack = [];
        } else {
            this.logging.stack.pop();
        }
        return this;
    },

    /**
     * Logging method, takes string that can be formatted, or an array of strings.
     * Each of these calls will result in a log message being output.
     * @param msg
     * @return Response object
     */
    verbose: function (msg) {
        return this.logArgs('verbose', Array.prototype.slice.call(arguments));
    },

    info: function (msg) {
        return this.logArgs('info', Array.prototype.slice.call(arguments));
    },


    debug: function (msg) {
        return this.logArgs('debug', Array.prototype.slice.call(arguments));
    },

    warn: function (msg) {
        return this.logArgs('warn', Array.prototype.slice.call(arguments));
    },

    fatal: function (msg) {
        return this.logArgs('fatal', Array.prototype.slice.call(arguments));
    },

    error: function (msg) {
        // res.logging.message = util.format.apply(this,arguments);
        return this.logArgs('error', Array.prototype.slice.call(arguments));
    },

    logSeparator: function () {
        return this.logArgs('info', ["######################################################################"]);
    },

    logDate: function (d, s) {
        d = d || new Date();
        return this.logObj({ localtime: DateUtil.toISOLocalString(d), utctime: d.toISOString() }).info(s);
    },

// Not used
    alert: function (msg) {
        return this;
    },

    /**
     * Compose and output a log message using the previously set values for level, args, etc. that have been
     * set in res.logging.
     * @param level One of 'verbose', 'debug', 'info', 'warn', 'error', 'fatal'
     * @param args Can be (i) array of strings that are to be formatted into a string,
     * (e.g. ["Hello %s", 'world']), (ii) a length 1 array of arrays of arrays intended for multi-line output (where supported)
     * where each subarray is to be formatted (e.g. [[["Hello %s", 'world'],["Goodbye"]]]),
     * (iii) an array of objects where the first array entry is not an array or string (e.g. [{a:b,c:4},{e:5}])
     * @return The response object, for chaining
     */
    logArgs: function (level, args) {
        var params = {
            level: level,
            module: this.logging.stack.join('.')
        };
        if (this.logging.length) {
            params.length = this.logging.length;
            delete this.logging.length;
        }
        if (this.logging.data) {
            params.data = this.logging.data;
            delete this.logging.data;
        }
        if (this.logging.action) {
            params.action = this.logging.action;
            delete this.logging.action;
        }
        if (this.req._reqId)
            params.reqId = this.req._reqId;
        if (args && args.length === 1 && (args[0] instanceof Array)) {
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
        return this.logMessage(params);
    },

    logTruncate: function (len) {
        this.logging.length = len;
        return this;
    },

    /**
     * Log a raw message in the spirit of Logger.logMessage, adding sessionID.
     * Looks for sessionID in req.session.id or req.sessionId, otherwise uses the passed in value (if any).
     * This is the method that calls the underlying logging outputter. If you want to use your own logging tool,
     * you can replace this method, or provide your own transport.
     * @param params
     * @return {*}
     */
    logMessage: function (params) {
        if (this.req && this.req.session && this.req.session.id) {
            params.sid = this.req.session.id;
        } else if (this.req && this.req.sessionId) {
            params.sid = this.req.sessionId;
        }
        Logger.logMessage(params);
        return this;
    },

    /**
     * Set the user-facing message that is to be used in an error or success response object
     * when calling success or fail. Will localize using req.i18n object if present.
     * If you are passing an already localized string, then do not use this method.
     * @param sprintf string followed by sprintf parameters
     * @return {*}
     */
    message: function () {
        this.logging.message = this.req.i18n ? this.req.i18n.__.apply(this.req.i18n, arguments) : util.format.apply(this, arguments);
        return this;
    },

// For weird situations, when we want to use the formatter, then get the string back
    getMessage: function () {
        return this.logging.message;
    },

    /**
     * Data to be logged as the json object in the log array
     * Parameters are action,data or just data
     res.logObj = function(arg0,arg1) {
            if( arg1 && typeof arg0 === 'string' ) {
                this.logging.action = arg0;
                this.logging.data = arg1;
            } else {
                this.logging.data = arg0;
            }
            return res;
        };
     */

    /**
     * Action is a unique column in the log output and is a machine-searchable verb that uniquely describes the type of log event.
     * arguments String or comma separated list of strings that are then joined with a '.'
     * @returns {*}
     */
    action: function () {
        if (arguments[0] instanceof Array) {
            this.logging.action = arguments[0].join('.');
        } else if (arguments.length > 1) {
            this.logging.action = Array.prototype.join.call(arguments, '.');
        } else {
            this.logging.action = arguments[0];
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
    logObj: function (arg0, arg1) {
        if (typeof arg0 === 'string' || typeof arg0 === 'number') {
            if (!this.logging.data)
                this.logging.data = {};
            this.logging.data[arg0] = arg1;
        } else {
            this.logging.data = arg0;
        }
        return this;
    },

    /**
     * Data to be included in an error or success. Or set as a parameter in res.success.
     */
    data: function (data) {
        this.logging.resData = data;
        return this;
    },

    /**
     * Set an alternate 'data', to be output with logging messages. Use if data is not suitable for logging, for
     * example if too big to output or if data contains passwords.
     */
    logData: function (data) {
        this.logging.resLogData = data;
        return this;
    },

    /**
     * Can use to add arbitrary objects to the success or error object
     * Example is to add validation errors using name 'validation'
     * @param name
     * @param value
     * @return {*}
     */
    setParam: function (name, value) {
        if (!this.logging.params) this.logging.params = {};
        this.logging.params[name] = value;
        return this;
    },

    /**
     * Set the errorId to use in an error response object when calling res.fail
     * @param errorId
     * @return {*}
     */
    errorId: function (errorId) {
        this.logging.errorId = errorId;
        return this;
    },

    /**
     * Do res.json with a built request error object. This should never localize the message
     * param because message may be constructed by the caller.
     * @param code (Required) Must be number
     * @param errorId (Optional) Must be a string or number
     * @param message (Optional) Must be pre-localized string, else use message().
     * @return {*}
     */
    fail: function (code, errorId, message) {

        // Parse parameters
        this.statusCode = code;
        if (errorId)
            this.logging.errorId = errorId;
        if (message)
            this.logging.message = message;

        // Construct and send response message
        this.failBuildAndSend();
    },

    failBuildAndSend: function () {
        if (this.logging.errorId || this.logging.message || response.logging.params || response.logging.resData) {
            var response = { error: buildResponseObject(this.req, this, this.logging.resData) };
            // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
            var logResponse = response;
            if (this.logging.resLogData) {
                logResponse = { error: buildResponseObject(this.req, this, this.logging.resLogData) };
            }
            this.action('response.error')
                .logObj('responseTime', this.responseTime())
                .logObj('response', logResponse)
                .logArgs('warn');
            return this._origSend(response);
        } else {
            return this.send();
        }
    },

    /**
     * Do res.json with a built request success object
     * @param code (Optional) Must be number
     * @param message (Optional) Must be string, or use message()
     * @param data (Optional) Data to send
     * @return {*}
     */
    success: function (obj) {

        // Parse options
        if (arguments.length >= 3) {
            this.statusCode = obj;
            this.logging.message = arguments[1];
            this.logging.resData = arguments[2];
        } else if (arguments.length === 2) {
            if (typeof arguments[1] === 'string') {
                this.logging.message = arguments[1];
                this.statusCode = obj;
            } else {
                this.logging.resData = arguments[1];
                if (typeof obj === 'number')
                    this.statusCode = obj;
                else
                    this.logging.message = obj;
            }
        } else {
            if (typeof obj === 'string')
                this.logging.message = obj;
            else if (typeof obj === 'number')
                this.statusCode = obj;
            else
                this.logging.resData = obj;
        }

        // Construct and send response message
        this.successBuildAndSend();
    },

    successBuildAndSend: function () {
        if (this.logging.resData || this.logging.message || this.logging.params || this.logging.errorId) {
            var response = { success: buildResponseObject(this.req, this, this.logging.resData) };
            // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
            var logResponse = response;
            if (this.logging.resLogData) {
                logResponse = { success: buildResponseObject(this.req, this, this.logging.resLogData) };
            }
            var self = this;
            this.action('response.success')
                .logObj('responseTime', self.responseTime())
                .logObj('res', logResponse)
                .logTruncate(1024).logArgs('info');
            return this._origSend(response);
        } else {
            return this.send();
        }
    },

    /**
     * Use for exceptions, to send response and log the error
     * We format the response in the JSON form status=500, body='{ error: message: "error message here", errorId: 123 } }'.
     * @param err
     */
    onError: function (err) {
        var msg = (err instanceof Error) ? err.toString() : JSON.stringify(err);
        var e = {error: {message: msg}};
        e.error.errorId = err.code ? err.code : err.name;
        this.logObj('exception', e).logArgs('error');
        return this._origSend(500, e);
    }
}

/**
 * Export a function that will cause the express res object to inherit from ResponseLogger
 * @returns {Function}
 */

module.exports = function () {

    return function (req, res, next) {

        // Add a logging object to the res object. The 'stack' property is used internally by pushRouteInfo and popRouteInfo.
        res.logging = {
            stack: []
        };

        // We need the super's send method
        res._origSend = res.send;
        
        // Add all the methods directly to the response object
        for (var funcName in ResponseLogger) {
            res[funcName] = ResponseLogger[funcName];
        }

        next();
    }
};

/**
 * Utility method to build and return a JSON success object from res.errorId and res.logging.
 * Object is in format:
 *  { message: "my message",
 *    data: { optional: "data" },
 *    errorId: "errorId.if.res.logging.errorId.even.though.successful",
 *    param1: "value.if.res.logging.param1" }
 * @param req
 * @param res
 * @param data
 * @returns {{}}
 */
function buildResponseObject(req, res, data) {
    var p = res.logging;
    var r = {};
    if (p.errorId) {
        if (typeof p.errorId === 'string') {
            r.errorId = res.logging.stack.join('.') + "." + p.errorId;
        } else {
            r.errorId = p.errorId;
        }
    }
    if (p.message) r.message = p.message;
    if (data) {
        r.data = data;
    }
    if (p.params) {
        _u.each(p.params, function (value, key) {
            r[key] = value;
        });
    }
    return r;
};

