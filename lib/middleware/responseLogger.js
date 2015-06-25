/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
_ = require('underscore');
var Logger = require('../logger');
var DateUtil = require('../dateutil');

/**
 * Middleware extends express.js response object, to be used for logging and responding to API calls.
 * This middleware creates a new ResponseLogger object with attached methods, then adds these methods
 * to the Express response object (mixins).
 */


/**
 * Our mixins that we add to the response object that provide logging and response methods.
 * Most logging methods can be chained. State is added to a _logging property that is added to the response object.
 * For example, the action state is stored as res._logging.action. The full list of _logging state properties
 * is:
 *      action - The 'action' column value when outputting to log.
 *      stack - Pushed and popped using pushRouteInfo and popRouteInfo methods. Should be string parts that
 *          are separated by '.'. The full stack is concatenated with '.' when output to log as the 'module' column.
 *      message - The text 'message' that will be output to log
 *      data - The 'data' column of the log output, can be set with logObj
 *      length - Set to truncate the overall length of the log output message
 *      resData - The data to be returned in the express response, and also output to log when calling send().
 *      resLogData - An alternative value to resData that is to be output to log, if resData is too large to be logged
 *      params -
 *      errorCode - An internal errorCode to be included in response object, maps to JSON API error.code
 */
var ResponseLogger = {

    /**
     * Replace express's res.send() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's send to finish the job. Will trap calls to res.json() and prevent
     * those from recalling res.send();
     * @returns this
     */
    send: function (body) {
        var obj = {status: this.statusCode, responseTime: this.hrResponseTime()};
        if (this.req._delayTime) {
            obj.delay = this.req._delayTime;
        }
        obj = _.extend(obj, this._logging.data);
        this.action('response.send').logObj(obj);
        this.info();
        // Trap case where res.json is called, which will result in res.send being called again
        if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
            // settings
            var app = this.app;
            var replacer = app.get('json replacer');
            var spaces = app.get('json spaces');
            var s = JSON.stringify(body, replacer, spaces);

            // content-type
            if (!this.get('Content-Type')) {
                this.set('Content-Type', 'application/json');
            }
            return this._origSend(s);
        }
        return this._origSend.apply(this, arguments);
    },

    /**
     * The time used since this res object was initialized by Express.
     * @returns {number}
     */
    responseTime: function () {
        return this.req._startTime ? ( new Date() - this.req._startTime ) : 0;
    },

    /**
     * High resolution response time.
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
        this._logging.stack.push(name);
        return this;
    },

    /**
     * See pushRouteInfo. Should be called if returning back up a function chain. Does not need to be
     * called if the function terminates the request with a response.
     * @param options Available options are 'all' if all action contexts are to be removed from the _logging stack.
     * @return Response object
     */
    popRouteInfo: function (options) {
        if (options && options.all === true) {
            this._logging.stack = [];
        } else {
            this._logging.stack.pop();
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
        // res._logging.message = util.format.apply(this,arguments);
        return this.logArgs('error', Array.prototype.slice.call(arguments));
    },

    logSeparator: function () {
        return this.logArgs('info', ["######################################################################"]);
    },

    logDate: function (d, s) {
        d = d || new Date();
        return this.logObj({localtime: DateUtil.toISOLocalString(d), utctime: d.toISOString()}).info(s);
    },

// Not used
    alert: function (msg) {
        return this;
    },

    /**
     * Compose and output a log message using the previously set values for level, args, etc. that have been
     * set in res._logging.
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
            module: this._logging.stack.join('.')
        };
        if (this._logging.length) {
            params.length = this._logging.length;
            delete this._logging.length;
        }
        if (this._logging.data) {
            params.data = this._logging.data;
            delete this._logging.data;
        }
        if (this._logging.action) {
            params.action = this._logging.action;
            delete this._logging.action;
        }
        if (this.req._reqId) {
            params.reqId = this.req._reqId;
        }
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
        this._logging.length = len;
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
        this._logging.message = this.req.i18n ? this.req.i18n.__.apply(this.req.i18n, arguments) : util.format.apply(this, arguments);
        return this;
    },

// For weird situations, when we want to use the formatter, then get the string back
    getMessage: function () {
        return this._logging.message;
    },

    /**
     * Data to be logged as the json object in the log array
     * Parameters are action,data or just data
     res.logObj = function(arg0,arg1) {
            if( arg1 && typeof arg0 === 'string' ) {
                this._logging.action = arg0;
                this._logging.data = arg1;
            } else {
                this._logging.data = arg0;
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
            this._logging.action = arguments[0].join('.');
        } else if (arguments.length > 1) {
            this._logging.action = Array.prototype.join.call(arguments, '.');
        } else {
            this._logging.action = arguments[0];
        }
        return this;
    },

    /**
     * Log a key,value or an object. If an object the any previous logged objects
     * are overwritten. If a key,value then add to the existing logged object.
     * Objects are written when a call to info, etc is made
     * @param key If a string or number then key,value is added, else key is added
     * @param value If key is a string or number then data.key is set to value
     * @return The response object, for chaining
     */
    logObj: function (arg0, arg1) {
        if (typeof arg0 === 'string' || typeof arg0 === 'number') {
            if (!this._logging.data) {
                this._logging.data = {};
            }
            this._logging.data[arg0] = arg1;
        } else {
            this._logging.data || ( this._logging.data = {} );
            this._logging.data = _.extend( this._logging.data, arg0 );
        }
        return this;
    },

    /**
     * Data to be included in a built error or success object. Can also be set as a parameter in res.success.
     * Note: If you want to respond with a specific json object, use res.json().
     */
    data: function (data) {
        this._logging.resData = data;
        return this;
    },

    /**
     * Set an alternate 'data', to be output with logging messages. Use if data is not suitable for logging, for
     * example if too big to output or if data contains passwords.
     */
    logData: function (data) {
        this._logging.resLogData = data;
        return this;
    },

    /**
     * Can use to add arbitrary properties to the top-level response object
     * Example is to add meta, links or included properties to a JSON API response.
     * See http://jsonapi.org/format/#document-structure-top-level
     * @param name {String|Object} If an object then _logging.params is extended with this object
     * @param value
     * @return {*}
     */
    respParams: function (name, value) {
        if (!this._logging.params) {
            this._logging.params = {};
        }
        if (_.isString(name)) {
            this._logging.params[name] = value;
        } else if (_.isObject(name)) {
            this._logging.params = _.extend(this._logging.params, name);
        }
        return this;
    },

    setParam: function (name, value) {
        this.respParams(name, value);
    },

    /**
     * Can use to add arbitrary properties to the error object, in the event of an error
     * Example is to add validation errors using name 'validation'
     * @param name {String|Object} If an object then _logging.errorParams is extended with this object
     * @param value
     * @return {*}
     */
    errorParams: function (name, value) {
        if (!this._logging.errorParams) {
            this._logging.errorParams = {};
        }
        if (_.isString(name)) {
            this._logging.errorParams[name] = value;
        } else if (_.isObject(name)) {
            this._logging.errorParams = _.extend(this._logging.errorParams, name);
        }
        return this;
    },

    /**
     * Set the errorCode to use in an error response object when calling res.fail.
     * Can be chained.
     * @param errorCode
     * @returns {ResponseLogger}
     */
    errorCode: function (errorCode) {
        this._logging.errorCode = errorCode;
        return this;
    },

    /**
     * @deprecated
     * See res.errorCode. This is maintained for backward compatibility.
     * @param errorId
     * @return {*}
     */
    errorId: function (errorId) {
        return this.errorCode(errorId);
    },

    /**
     * Calls res.json and uses a customer builder to build the response object in the event of a fail condition.
     * This should never localize the message param because message may be constructed by the caller.
     * This finalizes a response and should be at the end of a call chain.
     * Use to return any error condition. See also onError for returning a standardized response in the event of
     * an exception.
     * Equivalent to res.statusCode().errorCode().message().fail();
     * @param errorCode {String|Number} (Optional) Application-specific error, may also be set with res.errorCode(); Defaults to -1 if not specified.
     * @param opt_message {String} Must be a pre-localized string, else use res.message().
     * @return {*}
     */
    fail: function (errorCode, message) {

        // Parse parameters
        if (!_.isUndefined(errorCode)) {
            this._logging.errorCode = errorCode;
        } else {
            this._logging.errorCode = -1;
        }
        if (!_.isUndefined(message)) {
            this._logging.message = message;
        }

        // Construct and send response message
        this._failBuildAndSend();
    },

    _failBuildAndSend: function () {
        if (this._logging.errorCode || this._logging.message || response._logging.params || response._logging.resData) {
            var response = this._responseBuilder(this.req, this);
            // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
            var logResponse = response;
            if (this._logging.resLogData) {
                logResponse = {error: buildResponseObject(this.req, this, this._logging.resLogData)};
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
     * Terminate the request with a response object.
     * If an object is provided then will use that as the response data similar to res.json(), but building
     * our custom request success object (eg. using http://jsonapi.org/ format), otherwise you can add
     * the response data using res.data() and just leave this value blank;
     * Recommend you use res.status(200).message("my message").success(obj);
     * @param code (Optional) Must be number, or use res.status()
     * @param message (Optional) Must be string, or use res.message()
     * @param data (Optional) Data to send
     * @return {*}
     */
    success: function (opt_arg) {

        // Parse options
        if (arguments.length >= 3) {
            this.statusCode = opt_arg;
            this._logging.message = arguments[1];
            this._logging.resData = arguments[2];
        } else if (arguments.length === 2) {
            if (typeof arguments[1] === 'string') {
                this._logging.message = arguments[1];
                this.statusCode = opt_arg;
            } else {
                this._logging.resData = arguments[1];
                if (typeof opt_arg === 'number') {
                    this.statusCode = opt_arg;
                } else {
                    this._logging.message = opt_arg;
                }
            }
        } else {
            if (typeof opt_arg === 'string') {
                this._logging.message = opt_arg;
            } else if (typeof opt_arg === 'number') {
                this.statusCode = opt_arg;
            } else if (_.isObject(opt_arg)) {
                this._logging.resData = opt_arg;
            }
        }

        // Construct and send response message
        this._successBuildAndSend();
    },

    _successBuildAndSend: function () {
        if (this._logging.resData || this._logging.message || this._logging.params || this._logging.errorCode) {
            var response = this._responseBuilder(this.req, this);
            // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
            var logResponse = response;
            if (this._logging.resLogData) {
                logResponse = {success: buildResponseObject(this.req, this, this._logging.resLogData)};
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
     * Use for exceptions, to build and send the response to exceptions in a standard way, and to output a log error message.
     * Two response builders are included in this module, including one for http://jsonapi.org/format/#errors.
     * A custom error response builder function can also be used when instantiating this middleware.
     * Additional properties to be added to the error object should be added with res.setErrorParam();
     * Will set HTTP status to 500 if it is not already set to a number greater than or equal to 400.
     * @param err The exception object
     */
    onError: function (err) {
        // Set the HTTP statusCode to 500 if it has not already been set
        var statusCode = parseInt(this.statusCode, 10);
        if (!_.isNumber(statusCode) || statusCode < 400) {
            this.status(500);
        }
        // Build the response object that is returned in the body of the response
        var resp = this._responseBuilder(this.req, this, err);
        this.logObj('exception', resp); // .logArgs('error');
        return this._origSend(resp);
    }
}

/**
 * Export a function that will cause the express res object to inherit from ResponseLogger
 * @param opt_options {Object}
 *      responseBuilder: a method to build the response object in the event of an exception, error or success.
 *          Errors are indicated by the exception being passed in to the builder, or errorCode being defined.
 *          The value may be a function or 'json-api' to use the JSON API response builder.
 * @returns {Function}
 */

module.exports = function (opt_options) {

    var options = opt_options || {};

    return function (req, res, next) {

        // Add a privately used state object added to the res object to track state when method chaining.
        // The 'stack' property is used internally by pushRouteInfo and popRouteInfo.
        res._logging = {
            stack: []
        };

        // We need the super's send method
        res._origSend = res.send;

        // Add all the methods directly to the response object
        for (var funcName in ResponseLogger) {
            res[funcName] = ResponseLogger[funcName];
        }

        // Can override function that generates response object
        if (typeof options.responseBuilder === 'function') {
            res._responseBuilder = options.responseBuilder;
        } else if (options.responseBuilder === 'json-api') {
            res._responseBuilder = resUtil.jsonApiResponseBuilder;
        } else {
            res._responseBuilder = resUtil.defaultResponseBuilder;
        }

        next();
    }
};

var resUtil = {


    /**
     * Utility method to build and return a JSON success object built from res._logging.
     * Object is in format:
     *  { message: "my message",
     *    data: { optional: "data" },
     *    errorCode: "errorCode.if.res._logging.errorCode.even.though.successful",
     *    param1: "value.if.res._logging.param1" }
     * @param req
     * @param res
     * @param data
     * @returns {{}}
     */
    defaultResponseBuilder: function (req, res, opt_err) {

        var p = res._logging;

        if (!_.isUndefined(opt_err)) {

            // We have an exception
            var e = {
                status: res.statusCode
            };
            if (opt_err instanceof Error) {
                if (opt_err.code) {
                    e.errorCode = opt_err.code;
                } else if (opt_err.name) {
                    e.errorCode = opt_err.name;
                }
                e.message = opt_err.message;
            } else {
                e.message = JSON.stringify(opt_err);
            }
            if (_.isObject(p.errorParams)) {
                e = _.extend(e, p.errorParams);
            }
            return {error: e};

        } else if (!_.isUndefined(res._logging.errorCode)) {

            // We have an error
            var e = {
                status: res.statusCode
            };
            if (_.isString(p.errorCode)) {
                e.errorCode = res._logging.stack.join('.') + "." + p.errorCode;
            } else {
                e.errorCode = p.errorCode;
            }
            if (p.message) {
                e.message = p.message;
            }
            if (_.isObject(p.errorParams)) {
                e = _.extend(e, p.errorParams);
            }
            return {error: e};

        } else {

            var resp = {};
            var p = res._logging;
            if (p.resData) {
                resp.data = p.resData;
            }
            // Add top-level properties to the response object
            if (p.params) {
                resp = _.extend(resp, p.params);
            }
            return {success: resp};
        }
    },


    /**
     * Builds a response that conforms to JSON API spec http://jsonapi.org/format/#errors
     * @param req Not used
     * @param res Contains res._logging properties that are used to build the response object
     * @param opt_err {Object} The exception object, indicates an exception was thrown and we should return an error 500.
     * @returns {data: {}, {errors: *[]}}
     */
    jsonApiResponseBuilder: function (req, res, opt_err) {

        var p = res._logging;

        if (!_.isUndefined(opt_err)) {

            // We have an exception
            var e = {
                status: 500
            };
            if (opt_err instanceof Error) {
                e.detail = opt_err.message;
                if (opt_err.name) {
                    e.title = opt_err.name;
                }
                if (opt_err.code) {
                    e.code = opt_err.code;
                }
            } else {
                e.title = "Server exception";
                e.detail = JSON.stringify(opt_err);
            }
            if (_.isObject(p.errorParams)) {
                e = _.extend(e, p.errorParams);
            }
            return {errors: [e]};

        } else if (!_.isUndefined(res._logging.errorCode)) {

            // We have an error
            var e = {
                status: res.statusCode
            };
            if (_.isString(p.errorCode)) {
                e.code = res._logging.stack.join('.') + "." + p.errorCode;
            } else {
                e.code = p.errorCode;
            }
            if (p.message) {
                e.detail = p.message;
            }
            if (_.isObject(p.errorParams)) {
                e = _.extend(e, p.errorParams);
            }
            return {errors: [e]};

        } else {

            var resp = {};
            if (p.resData) {
                resp.data = p.resData;
            }
            // Add top-level properties to the response object
            if (p.params) {
                resp = _.extend(resp, p.params);
            }
            return resp;

        }
    }
};

