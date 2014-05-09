/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Stub for express.response object, used when passing response object around for logging purposes
 * @param req The request object, will be attached to res.
 * @param onSend
 */
module.exports = function( req, onSend ) {

    // Set onSend to your callback function if you want onSend to do anything, or you need a callback.
    // Or you can rely on the responseLogger to log that the send occurred.
    var self = {
        req: req,
        onSend: onSend
    };

    self.send = function() {
        self.popRouteInfo && self.popRouteInfo();
        self.onSend && self.onSend(Array.prototype.slice.call(arguments));
        return self;
    };

    self.json = function() {
        self.popRouteInfo && self.popRouteInfo({all:true});
        self.onSend && self.onSend(Array.prototype.slice.call(arguments));
        return self;
    };

    return self;
};

