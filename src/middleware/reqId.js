/*****************************************************************************
 * reqId.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

/**
 * Express middleware adds a unique id <code>_reqId</code> and high-resolution start time
 * <code>_hrStartTime</code> to the request object. The high-resolution start time uses
 * <code>process.hrtime()</code>.
 *
 * @module reqId
 */

/**
 * Request ID, unique for this instance, incremented from 0.
 */
var reqId = 0;

/**
 * Returns function that can be called to add Express middleware.
 */
module.exports = function () {

    return function (req, res, next) {

        req._reqId = ++reqId;
        req._hrStartTime = process.hrtime();
        next();
    };

};

