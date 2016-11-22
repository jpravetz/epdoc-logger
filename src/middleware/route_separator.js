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
    var sepLen = options.separatorLength || 22;
    var sepChar = options.separator || '#';
    var sep0 = Array(sepLen).join(sepChar);

    return function (req, res, next) {

        if (req.log) {
            var d = req._startTime || new Date();
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

            if( req.log.logMgr && req.log.logMgr.sep ) {
                sepChar = req.log.logMgr.sepChar;
            }
            var sepLen2 = Math.max(0, 62 - sepLen - data.path.length);
            req.log.action(data.method).data(data)._info(sep0 + ' ' + data.path + ' ' + Array(sepLen2).join(sepChar));
        }
        next();
    }

};

