/*****************************************************************************
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

/**
 * [Koa2]{@link http://koajs.com/} middleware outputs a log message for every route.
 * Depends on requestLogger being installed, must be added after the router.
 *
 * @module middleware/routeInfo
 */


/**
 * Return middleware that outputs a log message for every new request.
 * The log message is output via a {@link Logger} object that is attached
 * to the koa2 [context]{@link http://koajs.com}
 * object using the [responseLogger]{@link module:middleware/responseLogger} middleware.
 *
 * @function routeLogger
 *
 * @example
 * var middleware = require('epdoc-logger').koa();
 * app.all('*', middleware.requestLogger());
 * app.all('*', middleware.routeInfo());
 *
 * @returns {Function} Function that can be called to add middleware to a koa application
 */

module.exports = function () {

    return function routeInfo (ctx, next) {

        //var rawCookie = req.cookies['connect.sid'];

        if (ctx.log) {
            var d = ctx.state.startTime || ctx._startTime || new Date();
            var data = {
                method: ctx.method,
                path: ctx.path,
                protocol: ctx.protocol,
                //sidNew: ( rawCookie ? false : true ),
                ip: ctx.ip,
                query: ctx.query,
                utctime: (d).toISOString()
            };
            if (ctx.session && ctx.session.id) {
                data.sid = ctx.session.id;
            }
            if (ctx.method && ctx.method.toLowerCase() === 'post') {
                data['content-length'] = ctx.length;
            }
            ctx.log.action('routeInfo').data(data)._info();
        }

        return next();
    }

};

