/*****************************************************************************
 * routeLogger.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

/**
 * Middleware outputs a log message for every route
 * Depends on responseLogger, must be run after router
 */
module.exports = function() {

    return function(req,res,next) {

        //var rawCookie = req.cookies['connect.sid'];

        var d = req._startTime || new Date();
        res.pushRouteInfo('app');
        var logObj = {
            method: req.method,
            path: req.path,
            protocol: req.protocol,
            sid: (req.session ? req.session.id : "?"),
            //sidNew: ( rawCookie ? false : true ),
            ip: req.ip,
            query: req.query,
            utctime: (d).toISOString()
        };
        if( req.method && req.method.toLowerCase() === 'post' ) {
            logObj['content-length'] = req.get('Content-Length');
        }
        res.action('routeInfo').logObj(logObj).info();
        res.popRouteInfo();

        next();
    }

};

