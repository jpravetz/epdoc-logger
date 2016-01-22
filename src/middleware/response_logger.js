/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
_ = require('underscore');
var Logger = require('../logger');
var ModuleLogger = require('../module_logger');



/**
 * Expressjs mixin that provides logging and response methods.
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

var ReponseLogger = function () {
};

util.inherits(ReponseLogger, ModuleLogger);

ReponseLogger.prototype = {

    constructor: ModuleLogger,

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
        if (!this._origSendCalled) {
            this.action('response.send').logObj(obj).info();
        }
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
        this._origSendCalled = true;
        return this._origSend.apply(this, arguments);
    },

    /**
     * Replace express's res.end() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's end to finish the job. Will not output a log message if this was called
     * from res.send().
     * @returns this
     */
    end: function (body) {
        if (!this._origSendCalled) {
            var obj = {status: this.statusCode, responseTime: this.hrResponseTime()};
            if (this.req._delayTime) {
                obj.delay = this.req._delayTime;
            }
            obj = _.extend(obj, this._logging.data);
            this.action('response.end').logObj(obj).info();
        }
        return this._origEnd.apply(this, arguments);
    },



    /**
     * Set the user-facing message that is to be used in an error or success response object
     * when calling success or fail. Will localize using req.i18n object if present.
     * If you are passing an already localized string, then do not use this method.
     * @param sprintf string followed by sprintf parameters
     * @return {*}
     */
    message: function () {
        var i18n = this.ctx.req.i18n;
        this._logging.message = i18n ? i18n.__.apply(i18n, arguments) : util.format.apply(this, arguments);
        return this;
    },

// For weird situations, when we want to use the formatter, then get the string back
    getMessage: function () {
        return this._logging.message;
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

module.exports = ReponseLogger;
