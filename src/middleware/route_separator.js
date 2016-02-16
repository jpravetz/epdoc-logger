/*****************************************************************************
 * route_separator.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var moment = require('moment');

/**
 * Middleware outputs a separator and date
 * Depends on responseLogger
 */
module.exports = function( options ) {

    return function( req, res, next ) {

        if( res.log ) {
            var d = req._startTime || new Date();
            req.log.pushName('app');
            var data = {
                method: req.method,
                path: decodeURI(req.path),
                ip: req.ip
            };
            if( req.session ) {
                data.sid = req.session.id;
            }
            data.query = req.query;
            data.localtime = moment(d).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
            // data.utctime = (d).toISOString();

            req.log.action(data.method).logObj(data).info("###################### " + data.path + " ######################".slice(0,Math.max(0,49 - data.path.length)) );
            req.log.popName();
        }
        next();
    }

};

