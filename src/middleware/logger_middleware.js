/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
_ = require('underscore');
var ResponseLogger = require('./response_logger');
var ModuleLogger = require('../modulelogger');


/**
 * Middleware extends express.js response object, to be used for logging and responding to API calls.
 * This middleware creates a new ResponseLogger object with attached methods, then adds these methods
 * to the Express response object (mixins).
 */


/**
 * Export a function that will cause the express res object to inherit from ResponseLogger
 * @param opt_options {Object}
 *      responseBuilder: a method to build the response object in the event of an exception, error or success.
 *          Errors are indicated by the exception being passed in to the builder, or errorCode being defined.
 *          The value may be a function or 'json-api' to use the JSON API response builder.
 *      objName: {string} the name of an object to mixin our responseLogger methods with, defaults to 'log'.
 * @returns {Function}
 */

module.exports = function (opt_options) {

    var options = opt_options || {};
    var objName = options.objName || 'log';
    var logger = options.logger;

    return function (req, res, next) {

        // Add a privately used state object added to the res object to track state when method chaining.
        // The 'stack' property is used internally by pushRouteInfo and popRouteInfo.
        var ctx = {req: req, res, res};
        res[objName] = new ModuleLogger(logger, null, ctx);

        // We need the super's send method
        res._origSend = res.send;

        // We need the super's send method
        res._origEnd = res.end;

        // Add all the methods directly to the response object
        _.extend(res,ResponseLogger);
        //for (var funcName in ResponseLogger) {
        //    res[funcName] = ResponseLogger[funcName];
        //}

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
     * Can be populated with both data and errors by calling res.data(data).onError(err)
     * @param req Not used
     * @param res Contains res._logging properties that are used to build the response object
     * @param opt_err {Object} The exception object, indicates an exception was thrown and we should return an error 500.
     * @returns {data: {}, {errors: *[]}}
     */
    jsonApiResponseBuilder: function (req, res, opt_err) {

        var p = res._logging;

        var resp = {};

        // Add data to response object
        if (p.resData) {
            resp.data = p.resData;
        }

        // Add top-level properties to the response object
        if (p.params) {
            resp = _.extend(resp, p.params);
        }

        if (!_.isUndefined(opt_err)) {

            // Add exception to response object
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
            resp.errors = [e];

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
            resp.errors = [e];
        }

        return resp;
    }
};

