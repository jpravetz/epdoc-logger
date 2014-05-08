/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Middleware outputs a log message for every route
 * Depends on responseLogger, must be run after router
 */
module.exports = function() {

    return function(req,res,next) {

        //var rawCookie = req.cookies['connect.sid'];

        res.pushRouteInfo('app');
        res.action('routeInfo').logObj( {
            method: req.route.method,
            path: req.path,
            protocol: req.protocol,
            sid: (req.session ? req.session.id : "?"),
            //sidNew: ( rawCookie ? false : true ),
            ip: req.ip,
            params: req.params
        }).info();
        res.popRouteInfo();

        next();
    }


}

