/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2012 Armor5, Inc. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property
 * of Armor5, Inc. and its suppliers, if any. The intellectual and
 * technical concepts contained herein are proprietary to Armor5, Inc.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is
 * strictly forbidden unless prior written permission is obtained from
 * Armor5, Inc..
 **************************************************************************/

var util = require('util');
var dateutil = require('./dateutil');

module.exports = function () {

    var self = this;

    this.type = 'console';
    this.ready = true;
    this.bISODate = false;

    this.open = function( options, onSuccess ) {
        if( options.dateFormat && options.dateFormat === 'ISO' )
            self.bISODate = true;
        onSuccess && onSuccess(true);
    };

    this.clear = function() {
        ;
    };

    this.write = function( params ) {
        var msg = self._formatLogMessage( params );
        console.log( msg );
    };

    this.end = function() {
        ;
    };

    this.destroy = function() {
        ;
    };

    this.toString = function() {
        return "Console";
    };

    this._formatLogMessage = function( params ) {
        var msg = util.format( "[%s %s%s] %s",
            ( self.bISODate ? params.time.toISOString() : dateutil.formatMS(params.timeDiff) ),
            String('   '+params.level).toUpperCase().substr(-Math.max(5,params.level.length)),
            ( params.sessionId ? ( " " + params.sessionId ) : "" ),
            (params.module ? ( params.module + ": " ) : "") );
        if( typeof params.msg === 'string' ) {
            msg += params.msg;
        } else if( params.msg instanceof Array ) {
            msg += params.msg.join("\n        ");
        }
        return msg;
    };

};

function pad000(n){return n<10 ? '00'+n : (n<100 ? '0'+n : n);};
