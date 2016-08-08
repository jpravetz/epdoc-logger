/*****************************************************************************
 * middleware/route_separator.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var moment = require('moment');

/**
 * [Express]{@link http://expressjs.com/} middleware outputs a log message with a
 * separator and date for every route. Depends on the
 * [responseLogger]{@link module:middleware/responseLogger} middleware, and must be
 * added after the router.
 *
 * @module middleware/routeSeparator
 */


/**
 * Return middleware that outputs a log message for every new request.
 * The log message is output via a {@link Logger} object that is attached
 * to the express [response]{@link http://expressjs.com/en/4x/api.html#res}
 * object using the [responseLogger]{@link module:middleware/responseLogger} middleware.
 *
 * @function routeSeparator
 *
 * @example
 * var middleware = require('epdoc-logger').middleware();
 * app.all('*', middleware.responseLogger());
 * app.all('*', middleware.routeSeparator());
 *
 * @returns {Function} Function that can be called to add middleware to an express
 * [application]{@link http://expressjs.com/en/4x/api.html#app}.
 */
module.exports = function (options) {

    return function (req, res, next) {

        if (req.log) {
            var d = req._startTime || new Date();
            req.log.pushName('app');
            var data = {
                method: req.method,
                path: decodeURI(req.path),
                ip: req.ip
            };
            if (req.session) {
                data.sid = req.session.id;
            }
            data.query = req.query;
            data.localtime = moment(d).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            // data.utctime = (d).toISOString();

            req.log.action(data.method).data(data)._info("###################### " + data.path + " ######################".slice(0, Math.max(0, 49 - data.path.length)));
            req.log.popName();
        }
        next();
    }

};

