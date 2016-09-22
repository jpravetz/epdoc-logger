/*****************************************************************************
 * middleware/route_logger.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

/**
 * [Express]{@link http://expressjs.com/} middleware outputs a log message for every route.
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

module.exports = function() {

    return function(req,res,next) {

        //var rawCookie = req.cookies['connect.sid'];

        var d = req._startTime || new Date();
        var data = {
            method: req.method,
            path: req.path,
            protocol: req.protocol,
            //sidNew: ( rawCookie ? false : true ),
            ip: req.ip,
            query: req.query,
            utctime: (d).toISOString()
        };
        if( req.session && req.session.id ) {
            data.sid = req.session.id;
        }
        if( req.method && req.method.toLowerCase() === 'post' ) {
            data['content-length'] = req.get('Content-Length');
        }
        res.log.action('routeInfo').data(data)._info();

        next();
    }

};

