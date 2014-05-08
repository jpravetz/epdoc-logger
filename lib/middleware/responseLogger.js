/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
_u = require('underscore');
var Logger = require('../logger');
var DateUtil = require('a5dateutil');

/**
 * Middleware extends express.js response object, to be used for logging and responding to API calls.
 */
module.exports = function () {

    var buildResponseObject = function (req, res, data) {
        var p = res.logging;
        var r = {};
        if (p.errorId) {
            if (typeof p.errorId === 'string')
                r.errorId = res.logging.stack.join('.') + "." + p.errorId;
            else
                r.errorId = p.errorId;
        }
        if (p.message) r.message = p.message;
        if (data)
            r.data = data;
        if (p.params) {
            _u.each(p.params, function (value, key) {
                r[key] = value;
            });
        }
        return r;
    };


    return function (req, res, next) {

        // We override these methods to add logging to send method
        res._origSend = res.send;

        res.send = function () {
            res.action('respond.send')
                .logObj('status', res.statusCode)
                .logObj('responseTime', res.hrResponseTime());
            if (req._delayTime) {
                res.logObj('delay', req._delayTime);
            }
            res.info();
            return res._origSend.apply(this, arguments);
        };

        res.responseTime = function () {
            return req._startTime ? ( new Date() - req._startTime ) : 0;
        };

        /**
         * Returns the response time in milliseconds with two digits after the decimal.
         * @returns {number} Response time in milliseconds
         */
        res.hrResponseTime = function () {
            if( req._hrStartTime ) {
                var parts = process.hrtime(req._hrStartTime);
                return ( parts[0]*100000 + Math.round(parts[1]/10000) ) / 100;
                // return (((parts[0]*1000)+(parts[1]/1000000))%10000); //.toFixed(2);
            }
            return 0;
        };

        res.logging = {
            stack: []
        };

        /**
         * To be called at the entry point of each new API
         * Can also be called by submodules, in which case the submodules should call popRouteInfo when returning
         * @param name (required) String in the form 'api.org.create' (route.method or route.object.method).
         * @return Response object
         */
        res.pushRouteInfo = function (name) {
            res.logging.stack.push(name);
            return res;
        };

        res.popRouteInfo = function () {
            res.logging.stack.pop();
            return res;
        };

        /**
         * Logging method, takes string that can be formatted, or an array of strings
         * @param msg
         * @return {*}
         */
        res.verbose = function (msg) {
            return res.logArgs('verbose', Array.prototype.slice.call(arguments));
        };

        res.info = function (msg) {
            return res.logArgs('info', Array.prototype.slice.call(arguments));
        };

        res.debug = function (msg) {
            return res.logArgs('debug', Array.prototype.slice.call(arguments));
        };

        res.warn = function (msg) {
            return res.logArgs('warn', Array.prototype.slice.call(arguments));
        };

        res.fatal = function (msg) {
            return res.logArgs('fatal', Array.prototype.slice.call(arguments));
        };

        res.error = function (msg) {
            // res.logging.message = util.format.apply(this,arguments);
            return res.logArgs('error', Array.prototype.slice.call(arguments));
        };

        res.logSeparator = function () {
            return res.logArgs('info', ["######################################################################"]);
        };

        res.logDate = function (d, s) {
            d = d || new Date();
            return res.logObj({ localtime: DateUtil.toISOLocalString(d), utctime: d.toISOString() }).info(s);
        };

        // Not used
        res.alert = function (msg) {
            return res;
        };

        /**
         * Compose a message from level, args, and any previous state in res.logging.
         * @param level One of 'verbose', 'debug', 'info', 'warn', 'error', 'fatal'
         * @param args Can be (i) array of strings that are to be formatted into a string,
         * (e.g. ["Hello %s", 'world']), (ii) a length 1 array of arrays of arrays intended for multi-line output (where supported)
         * where each subarray is to be formatted (e.g. [[["Hello %s", 'world'],["Goodbye"]]]),
         * (iii) an array of objects where the first array entry is not an array or string (e.g. [{a:b,c:4},{e:5}])
         * @return The response object, for chaining
         */
        res.logArgs = function (level, args) {
            var params = {
                level: level,
                module: res.logging.stack.join('.')
            };
            if (res.logging.length) {
                params.length = res.logging.length;
                delete res.logging.length;
            }
            if (res.logging.data) {
                params.data = res.logging.data;
                delete res.logging.data;
            }
            if (res.logging.action) {
                params.action = res.logging.action;
                delete res.logging.action;
            }
            if (req._reqId)
                params.reqId = req._reqId;
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
            return res.logMessage(params);
        };

        res.logTruncate = function (len) {
            res.logging.length = len;
            return res;
        };

        /**
         * Log a raw message in the Logger.logMessage spirit, adding sessionID
         * @param params
         * @return {*}
         */
        res.logMessage = function (params) {
            if (req && req.session && req.session.id)
                params.sid = req.session.id;
            Logger.logMessage(params);
            return res;
        };

        /**
         * Set the user-facing message that is to be used in an error or success response object
         * when calling success or fail. Will localize using req.i18n object if present.
         * @param sprintf string followed by sprintf parameters
         * @return {*}
         */
        res.message = function () {
            res.logging.message = req.i18n ? req.i18n.__.apply(req.i18n, arguments) : util.format.apply(this, arguments);
            return res;
        };

        // For weird situations, when we want to use the formatter, then get the string back
        res.getMessage = function () {
            return res.logging.message;
        };

        /**
         * Data to be logged as the json object in the log array
         * Parameters are action,data or just data
         res.logObj = function(arg0,arg1) {
            if( arg1 && typeof arg0 === 'string' ) {
                res.logging.action = arg0;
                res.logging.data = arg1;
            } else {
                res.logging.data = arg0;
            }
            return res;
        };
         */

        /**
         * Action is a unique column in the log output and is a machine-searchable verb that uniquely describes the type of log event.
         * arguments String or comma separated list of strings that are then joined with a '.'
         * @returns {*}
         */
        res.action = function () {
            if (arguments[0] instanceof Array) {
                res.logging.action = arguments[0].join('.');
            } else if (arguments.length > 1) {
                res.logging.action = Array.prototype.join.call(arguments, '.');
            } else {
                res.logging.action = arguments[0];
            }
            return res;
        };

        /**
         * Log a key,value or an object. If an object the any previous logged objects
         * are overwritten. If a key,value then add to the existing logged object.
         * Objects are written when a call to info, etc is made
         * @param key If a string or number then key,value is added, else key is added
         * @param value If key is a string or number then data.key is set to value
         * @return The logging object, for chaining
         */
        res.logObj = function (arg0, arg1) {
            if (typeof arg0 === 'string' || typeof arg0 === 'number') {
                if (!res.logging.data)
                    res.logging.data = {};
                res.logging.data[arg0] = arg1;
            } else {
                res.logging.data = arg0;
            }
            return res;
        };

        /**
         * Data to be included in an error or success. Or set as a parameter in res.success.
         */
        res.data = function (data) {
            res.logging.resData = data;
            return res;
        };

        /**
         * Set an alternate 'data', to be output with logging messages. Use if data is not suitable for logging, for
         * example if too big to output or if data contains passwords.
         */
        res.logData = function (data) {
            res.logging.resLogData = data;
            return res;
        };

        /**
         * Can use to add arbitrary objects to the success or error object
         * Example is to add validation errors using name 'validation'
         * @param name
         * @param value
         * @return {*}
         */
        res.setParam = function (name, value) {
            if (!res.logging.params) res.logging.params = {};
            res.logging.params[name] = value;
            return res;
        };

        /**
         * Set the errorId to use in an error response object when calling res.fail
         * @param errorId
         * @return {*}
         */
        res.errorId = function (errorId) {
            res.logging.errorId = errorId;
            return res;
        };

        /**
         * Do res.json with a built request error object. This should never localize the message
         * param because message may be constructed by the caller.
         * @param code (Required) Must be number
         * @param errorId (Optional) Must be a string or number
         * @param message (Optional) Must be pre-localized string, else use message().
         * @return {*}
         */
        res.fail = function (code, errorId, message) {

            // Parse parameters
            res.statusCode = code;
            if (errorId)
                res.logging.errorId = errorId;
            if (message)
                res.logging.message = message;

            // Construct and send response message
            res.failBuildAndSend();
        };

        res.failBuildAndSend = function () {
            if (res.logging.errorId || res.logging.message || response.logging.params || response.logging.resData) {
                var response = { error: buildResponseObject(req, res, res.logging.resData) };
                // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
                var logResponse = response;
                if (res.logging.resLogData) {
                    logResponse = { error: buildResponseObject(req, res, res.logging.resLogData) };
                }
                res.action('response.error')
                    .logObj('responseTime', res.responseTime())
                    .logObj('response', logResponse)
                    .logArgs('warn');
                return res._origSend(response);
            } else {
                return res.send();
            }
        };

        /**
         * Do res.json with a built request success object
         * @param code (Optional) Must be number
         * @param message (Optional) Must be string, or use message()
         * @param data (Optional) Data to send
         * @return {*}
         */
        res.success = function (obj) {

            // Parse options
            if (arguments.length >= 3) {
                res.statusCode = obj;
                res.logging.message = arguments[1];
                res.logging.resData = arguments[2];
            } else if (arguments.length === 2) {
                if (typeof arguments[1] === 'string') {
                    res.logging.message = arguments[1];
                    res.statusCode = obj;
                } else {
                    res.logging.resData = arguments[1];
                    if (typeof obj === 'number')
                        res.statusCode = obj;
                    else
                        res.logging.message = obj;
                }
            } else {
                if (typeof obj === 'string')
                    res.logging.message = obj;
                else if (typeof obj === 'number')
                    res.statusCode = obj;
                else
                    res.logging.resData = obj;
            }

            // Construct and send response message
            res.successBuildAndSend();
        };

        res.successBuildAndSend = function () {
            if (res.logging.resData || res.logging.message || res.logging.params || res.logging.errorId) {
                var response = { success: buildResponseObject(req, res, res.logging.resData) };
                // logResponse is an alt response to show when the actual response shouldn't be logged (e.g. contains passwords or is too big)
                var logResponse = response;
                if (res.logging.resLogData) {
                    logResponse = { success: buildResponseObject(req, res, res.logging.resLogData) };
                }
                res.action('response.success')
                    .logObj('responseTime', res.responseTime())
                    .logObj('res', logResponse)
                    .logTruncate(1024).logArgs('info');
                return res._origSend(response);
            } else {
                return res.send();
            }
        };

        /**
         * Use for exceptions, to send response and log the error
         * @param err
         */
        res.onError = function (err) {
            var e = {error: {message: err.toString()}};
            e.error.errorId = err.code ? err.code : err.name;
            res.logObj('exception', e).logArgs('error');
            return res._origSend(500, e);
        };

        /**
         * Use for exceptions, to send response and log the error
         * @param err
         */
        res.onError = function (err) {
            var msg = (err instanceof Error) ? err.toString() : JSON.stringify(err);
            var e = {error: {message: msg}};
            e.error.errorId = err.code ? err.code : err.name;
            res.logObj('exception', e).logArgs('error');
            return res._origSend(500, e);
        };

        next();
    };


}

