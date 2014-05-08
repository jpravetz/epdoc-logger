/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Middleware outputs a separator and date
 * Depends on responseLogger
 */
module.exports = function() {

    return function(req,res,next) {

        res.pushRouteInfo('app').logSeparator().action('timestamp').logDate( new Date() );
        res.popRouteInfo();
        next();
    }


}

