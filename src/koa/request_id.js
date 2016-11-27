/*****************************************************************************
 * koa/requestId.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

/**
 * Koa2 middleware adds a unique id <code>_reqId</code> and high-resolution start time
 * <code>_hrStartTime</code> to the context object. The high-resolution start time uses
 * <code>process.hrtime()</code>.
 *
 * Requires node 7
 *
 * @module koa/requestId
 */


/**
 * Request ID, unique for this process, incremented from 0 for every new request.
 */
var reqId = 0;

/**
 * Return middleware that adds a unique id <code>_reqId</code> and high-resolution start time
 * <code>_hrStartTime</code> to the koa context object
 *
 * @example
 * var koa = require('epdoc-logger').koa();
 * var app = koa();
 * app.use(koa.requestId());
 *
 * @returns {Function} Function that can be called to add middleware to an express
 * [application]{@link http://expressjs.com/en/4x/api.html#app}.
 */
module.exports = function () {

    return async function requestId (ctx, next) {

        ctx._reqId = ++reqId;
        ctx.state.hrStartTime = process.hrtime();
        ctx.state.startTime = new Date();
        await next();
        const ms = new Date() - ctx.state.startTime;
        ctx.set('X-Response-Time', `${ms}ms`);
    };

};

