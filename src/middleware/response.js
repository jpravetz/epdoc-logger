/*****************************************************************************
 * response.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var util = require('util');
_ = require('underscore');
var LogMgr = require('../log_mgr');
var Log = require('../logger');



/**
 * Expressjs mixin that provides logging and response methods.
 * These methods are added to the response object.
 * Most logging methods can be chained. State is added to a log property that is added to the response object.
 * For example, the action state is stored as res.log.action. The full list of log state properties
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

var Response = function () {
};

// util.inherits(Response, ModuleLogger);

Response.prototype = {

    constructor: Response,

    /**
     * Replace express's res.send() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's send to finish the job. Will trap calls to res.json() and prevent
     * those from recalling res.send();
     * @returns this
     */
    send: function (body) {
        var res = this;
        var req = this.log.ctx.req;
        var log = this.log;
        // obj is the object that will be returned in the HTTP response
        var data = {status: this.statusCode, responseTime: log.getHrResponseTime()};
        if (res._delayTime) {
            data.delay = res._delayTime;
        }
        data = _.extend(data, this.log.resData);
        if (!res._origSendCalled) {
            log.action('response.send').data(data)._info();
        }
        // Trap case where res.json is called, which will result in res.send being called again
        if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
            // settings
            var app = req.app;
            var replacer = app.get('json replacer') || null;
            var spaces = app.get('json spaces') || '  ';
            var s = JSON.stringify(body, replacer, spaces);

            // content-type
            if (!req.get('Content-Type')) {
                req.set('Content-Type', 'application/json');
            }
            return res._origSend(s);
        }
        res._origSendCalled = true;
        return res._origSend.apply(this, arguments);
    },

    /**
     * Replace express's res.end() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's end to finish the job. Will not output a log message if this was called
     * from res.send().
     * @returns this
     */
    end: function (body) {
        var res = this;
        var log = this.log;
        if (!res._origSendCalled) {
            var data = {status: res.statusCode, responseTime: log.getHrResponseTime()};
            if (res._delayTime) {
                data.delay = res._delayTime;
            }
            data = _.extend(data, this.log.resData);
            this.action('response.end').data(data)._info();
        }
        return this._origEnd.apply(this, arguments);
    },


    /**
     * Delay time is a field you can set manually to indicate a process 'paused' for whatever reason, perhaps to
     * back off on processing too many requests at the same time, or to randomize password verification
     * response time (the later being for security reasons).
     * @returns {number} Delay time in milliseconds
     */
    delayTime: function () {
        return this._delayTime;
    },


    /**
     * Set the user-facing message that is to be used in an error or success response object
     * when calling success or fail. Will localize using req.i18n object if present.
     * If you are passing an already localized string, then do not use this method.
     * @param sprintf string followed by sprintf parameters
     * @return {*}
     */
    message: function () {
        var i18n = this.req.i18n;
        this._resMessage = i18n ? i18n.__.apply(i18n, arguments) : util.format.apply(this, arguments);
        return this;
    },

// For weird situations, when we want to use the formatter, then get the string back
    getMessage: function () {
        return this._resMessage;
    },


    /**
     * Can use to add arbitrary properties to the top-level response object
     * Example is to add meta, links or included properties to a JSON API response.
     * See http://jsonapi.org/format/#document-structure-top-level
     * @param name {String|Object} If an object then log.params is extended with this object
     * @param value
     * @return {*}
     */
    respParams: function (name, value) {
        if (!this.log.params) {
            this.log.params = {};
        }
        if (_.isString(name)) {
            this.log.params[name] = value;
        } else if (_.isObject(name)) {
            this.log.params = _.extend(this.log.params, name);
        }
        return this;
    },

    setParam: function (name, value) {
        this.respParams(name, value);
    },

    /**
     * Can use to add arbitrary properties to the error object, in the event of an error
     * Example is to add validation errors using name 'validation'
     * @param name {String|Object} If an object then log.errorParams is extended with this object
     * @param value
     * @return {*}
     */
    errorParams: function (name, value) {
        if (!this.log.errorParams) {
            this.log.errorParams = {};
        }
        if (_.isString(name)) {
            this.log.errorParams[name] = value;
        } else if (_.isObject(name)) {
            this.log.errorParams = _.extend(this.log.errorParams, name);
        }
        return this;
    },

    /**
     * Set the errorCode to use in an error response object when calling res.fail.
     * Can be chained.
     * @param errorCode
     * @returns {Response}
     */
    errorCode: function (errorCode) {
        this.log.errorCode = errorCode;
        return this;
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
            this.log.errorCode = errorCode;
        } else {
            this.log.errorCode = -1;
        }
        if (!_.isUndefined(message)) {
            this.log.message = message;
        }

        // Construct and send response message
        this._failBuildAndSend();
    },

    _failBuildAndSend: function () {
        if (this.log.errorCode || this.log.message || response.log.params || response.log.resData) {
            var response = this._responseBuilder(this.req, this);
            // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
            var logResponse = response;
            if (this.log.resData) {
                logResponse = {error: buildResponseObject(this.req, this, this.log.resData)};
            }
            this.action('response.error')
                .data('responseTime', this.responseTime())
                .data('response', logResponse)
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
            this.log.message = arguments[1];
            this.log.resData = arguments[2];
        } else if (arguments.length === 2) {
            if (typeof arguments[1] === 'string') {
                this.log.message = arguments[1];
                this.statusCode = opt_arg;
            } else {
                this.log.resData = arguments[1];
                if (typeof opt_arg === 'number') {
                    this.statusCode = opt_arg;
                } else {
                    this.log.message = opt_arg;
                }
            }
        } else {
            if (typeof opt_arg === 'string') {
                this.log.message = opt_arg;
            } else if (typeof opt_arg === 'number') {
                this.statusCode = opt_arg;
            } else if (_.isObject(opt_arg)) {
                this.log.resData = opt_arg;
            }
        }

        // Construct and send response message
        this._successBuildAndSend();
    },

    _successBuildAndSend: function () {
        if (this.log.resData || this.log.message || this.log.params || this.log.errorCode) {
            var response = this._responseBuilder(this.req, this);
            // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
            var logResponse = response;
            if (this.log.resLogData) {
                logResponse = {success: buildResponseObject(this.req, this, this.log.resLogData)};
            }
            var self = this;
            this.action('response.success')
                .logObj('responseTime', self.responseTime())
                .logObj('res', logResponse)
                .logTruncate(1024).logArgs('info');
            this._origSendCalled = true;
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
};

module.exports = Response;
