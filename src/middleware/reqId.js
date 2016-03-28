/*****************************************************************************
 * reqId.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

/**
 * Express middleware adds a unique id ```_reqId``` and high-resolution start time
 * ```_hrStartTime``` to the request object. The high-resolution start time uses
 * ```process.hrtime()```.
 */

var reqId = 0;

module.exports = function () {

    return function (req, res, next) {

        req._reqId = ++reqId;
        req._hrStartTime = process.hrtime();
        next();
    };

};

