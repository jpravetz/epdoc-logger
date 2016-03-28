/*****************************************************************************
 * route_logger.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

/**
 * Middleware outputs a log message for every route
 * Depends on responseLogger being installed, must be run after router
 */
module.exports = function() {

    return function(req,res,next) {

        //var rawCookie = req.cookies['connect.sid'];

        var d = req._startTime || new Date();
        res.log.pushName('app');
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
        res.log.popName();

        next();
    }

};

