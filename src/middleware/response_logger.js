/*****************************************************************************
 * middleware/response_logger.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var Response = require('./response');
var Logger = require('../logger');

/**
 * [Express]{@link http://expressjs.com/} middleware extends express.js
 * [response]{@link http://expressjs.com/en/4x/api.html#res} object by adding a
 * {@link Logger} object via which logging can be done in the context of the request. Also extends
 * [response.send]{@link http://expressjs.com/en/4x/api.html#res.send} and
 * [response.end]{@link http://expressjs.com/en/4x/api.html#res.send} methods to automatically
 * log a message when a response is sent. This message will include the response time for the
 * request.
 *
 * @module middleware/responseLogger
 */


/**
 * Return middleware that can add a {@link Logger} object to the express response object.
 * @function responseLogger
 *
 * @example
 * var middleware = require('epdoc-logger').middleware();
 * app.all('*', middleware.responseLogger());
 *
 * @param [options] {Object}
 * @param [options.objName=log] {string} The name of the response object property
 * to which to attach the {@link Logger} object.
 * @param [options.excludeMethod] {string|Array of string} A list of HTTP methods for which to skip
 *   adding log capabilities to the request. Strings are case insenstive. Eg. are 'OPTIONS', 'GET'.
 * @returns {Function} Function that can be called to add middleware to an express
 * [application]{@link http://expressjs.com/en/4x/api.html#app}.
 */

module.exports = function (options) {

    options || ( options = {});
    var objName = options.objName || 'log';
    var emitter = options.emitter || 'app';
    var logMgr = options.logMgr;
    if (!logMgr) {
        logMgr = require('../../index').getLogManager();
    }
    var excludeMethods;
    if (typeof options.excludeMethod === 'string') {
        excludeMethods = [options.excludeMethod]
    } else if (options.excludeMethod instanceof Array) {
        excludeMethods = options.excludeMethod;
    }

    return function (req, res, next) {

        var bSkip = false;
        if (excludeMethods) {
            for (var mdx = 0; mdx < excludeMethods.length && !bSkip; mdx++) {
                var method = excludeMethods[mdx].toLowerCase();
                if (req.method && req.method.toLowerCase() === method) {
                    bSkip = true;
                }
            }
        }
        var ctx = { req: req, res: res };
        req[objName] = new Logger(logMgr, emitter, ctx);
        res[objName] = req[objName];

        if (bSkip) {
            res[objName].silent = true;
        } else {
            // We need the super's send method because we're going to muck with it
            res._origSend = res.send;
            res.send = Response.send;

            // We need the super's send method
            res._origEnd = res.end;
            res.end = Response.end;
        }

        next();
    }
};
