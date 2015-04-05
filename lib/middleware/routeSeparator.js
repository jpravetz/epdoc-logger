/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var DateUtil = require('../dateutil');

/**
 * Middleware outputs a separator and date
 * Depends on responseLogger
 */
module.exports = function( options ) {

    return function( req, res, next ) {

        var d = req._startTime || new Date();
        res.pushRouteInfo('app');
        var obj = {method:req.method,path:decodeURI(req.path),ip:req.ip};
        if( res.session ) {
            obj.sid = req.session.id;
        }
        obj.query = req.query;
        obj.localtime = DateUtil.toISOLocalString(d);
        // obj.utctime = (d).toISOString();

        res.action(obj.method).logObj(obj).info("###################### " + obj.path + " ######################".slice(0,Math.max(0,49 - obj.path.length)) );
        res.popRouteInfo();
        next();
    }

};

