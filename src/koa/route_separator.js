/*****************************************************************************
 * middleware/route_separator.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

const format = require('../format');

/**
 * [Koa2]{@link http://koajs.com/} middleware outputs a log message with a
 * separator and date for every route. Depends on the
 * [logger]{@link module:koa/logger} middleware, and must be
 * added after the router.
 *
 * @module koa/routeSeparator
 */


/**
 * Return middleware that outputs a log message for every new request.
 * The log message is output via a {@link Logger} object that is attached
 * to the koa context.
 *
 * @function routeSeparator
 *
 * @example
 * let middleware = require('epdoc-logger').koa();
 * app.all('*', middleware.requestLogger());
 * app.all('*', middleware.routeSeparator({separator:'-'}));
 *
 * output: "--------------------- /a -------------------------------------"
 *
 * @param {Object} [options]
 * @param {Number} [options.separatorLength=22] The length of the separator preceeding the path.
 *   Note that this options may be discontinued in a future release.
 * @param {char} [options.separator='#'] The character to use as a separator. This is overwritten
 * by the value set for the logManager.
 * @returns {Function} Function that can be called to add middleware to an express
 * [application]{@link http://expressjs.com/en/4x/api.html#app}.
 */
module.exports = function (options) {

    options || (options = {});
    let sepLenLeft = options.separatorLength || 22;
    let sepChar = options.separator || '#';
    let sepLeft = Array(sepLenLeft).join(sepChar);

    return async function routeSeparator (ctx, next) {

        if (ctx.log) {
            let d = ctx.state.startTime || ctx._startTime || new Date();
            let data = {
                method: ctx.method,
                path: decodeURI(ctx.path),
                ip: ctx.ip
            };
            if (ctx.session) {
                data.sid = ctx.session.id;
            }
            data.query = ctx.query;
            data.localtime = format.toISOLocaleString(d);
            // data.utctime = (d).toISOString();

            if (ctx.log.logMgr && ctx.log.logMgr.sep) {
                sepChar = ctx.log.logMgr.sepChar;
            }
            let sepLenRight = Math.max(0, 62 - sepLenLeft - data.path.length);
            ctx.log.action(data.method).data(data)._info(sepLeft + ' ' + data.path + ' ' + Array(sepLenRight).join(sepChar));
        }

        await next();
    }

};

