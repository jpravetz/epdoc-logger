/*****************************************************************************
 * middleware/reqId.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

/**
 * Express middleware adds a unique id <code>_reqId</code> and high-resolution start time
 * <code>_hrStartTime</code> to the request object. The high-resolution start time uses
 * <code>process.hrtime()</code>.
 *
 * @module middleware/reqId
 */


/**
 * Request ID, unique for this process, incremented from 0 for every new request.
 */
var reqId = 0;

/**
 * Return middleware that adds a unique id <code>_reqId</code> and high-resolution start time
 * <code>_hrStartTime</code> to the express request object
 *
 * @function routeSeparator
 *
 * @example
 * var middleware = require('epdoc-logger').middleware();
 * var app = express();
 * app.use(middleware.reqId());
 *
 * @returns {Function} Function that can be called to add middleware to an express
 * [application]{@link http://expressjs.com/en/4x/api.html#app}.
 */
module.exports = function () {

    return function (req, res, next) {

        req._reqId = ++reqId;
        req._hrStartTime = process.hrtime();
        next();
    };

};

