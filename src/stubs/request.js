/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

/**
 * Stub for express.request object, used when passing request object around when simulating req/res/next flow.
 * @param name Define the name to use for your own 'locals' (private variables).
 * @param options The object to attach to req[name], defaults to {}.
 * @return A request object
 */

var Request = function(options) {
    this._startTime = (new Date()).getTime();
    if( options instanceof Object ) {
        for( var propName in options ) {
            this[propName] = options[propName];
        }
    }
};

module.exports = Request;
