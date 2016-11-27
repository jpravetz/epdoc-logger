/*****************************************************************************
 * middleware/route_logger.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

/**
 * [Koa2]{@link http://koajs.com/} middleware outputs a log message for every route.
 * Depends on responseLogger being installed, must be added after the router.
 *
 * @module middleware/routeLogger
 */


/**
 * Return middleware that outputs a log message for every new request.
 * The log message is output via a {@link Logger} object that is attached
 * to the express [response]{@link http://expressjs.com/en/4x/api.html#res}
 * object using the [responseLogger]{@link module:middleware/responseLogger} middleware.
 *
 * @function routeLogger
 *
 * @example
 * var middleware = require('epdoc-logger').middleware();
 * app.all('*', middleware.responseLogger());
 * app.all('*', middleware.routeLogger());
 *
 * @returns {Function} Function that can be called to add middleware to an express
 * [application]{@link http://expressjs.com/en/4x/api.html#app}.
 */

module.exports = function () {

    return function *routeInfo (ctx, next) {

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

        yield next;
    }

};

