/*****************************************************************************
 * middleware/response.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';


/**
 * Koa2 middelware to log a response
 */

module.exports = function (options) {

    options || ( options = {});
    let objName = options.objName || 'log';
    let emitter = options.emitter || 'app';
    let logMgr = options.logMgr;
    if (!logMgr) {
        logMgr = require('../../index').getLogManager();
    }
    let excludeMethods;
    if (typeof options.excludeMethod === 'string') {
        excludeMethods = [options.excludeMethod]
    } else if (options.excludeMethod instanceof Array) {
        excludeMethods = options.excludeMethod;
    }

    return async function requestLogger (ctx, next) {

        let bSkip = false;
        if (excludeMethods) {
            for (let mdx = 0; mdx < excludeMethods.length && !bSkip; mdx++) {
                let method = excludeMethods[mdx].toLowerCase();
                if (ctx.req.method && ctx.req.method.toLowerCase() === method) {
                    bSkip = true;
                }
            }
        }
        let log = new Logger(logMgr, emitter, this);
        this[objName] = log;

        if (bSkip) {
            log.silent = true;
        } else {
            ctx.delayTime = function () {
                return ctx.state._delayTime;
            };
        }

        await next();

        log.data({ status: ctx.res.status }).hrElapsed('responseTime');
        if (ctx.state.delayTime) {
            log.data('delay', ctx.state.delayTime);
        }
        // If you want to log more properties you can add them to res._logSendData
        if (ctx.state.logSendData) {
            Object.keys(ctx.state.logSendData).forEach((key) => {
                log.data(key, ctx.state.logSendData[key]);
            });
        }
        log.action('response.send')._info();

    }
};

