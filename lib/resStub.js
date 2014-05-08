/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Stub for express.response object, used when passing response object around for logging purposes
 */
module.exports = function() {

    var self = this;

    // Set this to your callback function
    this.onSend;

    this.send = function() {
        self.popRouteInfo && self.popRouteInfo();
        self.onSend && self.onSend(Array.prototype.slice.call(arguments));
        return self;
    };

    this.json = function() {
        self.popRouteInfo && self.popRouteInfo();
        self.onSend && self.onSend(Array.prototype.slice.call(arguments));
        return self;
    };


};

