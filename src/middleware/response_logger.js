/*****************************************************************************
 * response_logger.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

_ = require('underscore');
var Response = require('./response');
var Logger = require('../logger');


/**
 * Middleware extends express.js response object, to be used for logging and responding to API
 * calls. This middleware creates a new ResponseLogger object with attached methods, then adds
 * these methods to the Express response object (mixins).
 */


/**
 * Add a log object to req and res objects.
 *
 * @class Response
 * @param opt_options {Object}
 *      responseBuilder: a method to build the response object in the event of an exception, error
 *   or success. Errors are indicated by the exception being passed in to the builder, or errorCode
 *   being defined. The value may be a function or 'json-api' to use the JSON API response builder.
 *   objName: {string} the name of an object to mixin our responseLogger methods with, defaults to
 *   'log'.
 * @returns {Function}
 */

module.exports = function (options) {

    options || ( options = {});
    var objName = options.objName || 'log';
    var logMgr = options.logMgr;
    if (!logMgr) {
        logMgr = require('../../index').logMgr();
    }

    return function (req, res, next) {

        // Add a privately used state object added to the req and res object to track state when
        // method chaining. The 'stack' property is used internally by pushRouteInfo and
        // popRouteInfo.
        var ctx = { req: req, res: res };
        req[objName] = new Logger(logMgr, null, ctx);
        res[objName] = req[objName];

        // We need the super's send method because we're going to muck with it
        res._origSend = res.send;

        // We need the super's send method
        res._origEnd = res.end;

        // Add all the methods directly to the response object
        _.extend(res, Response);

        next();
    }
};
