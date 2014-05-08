/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
var dateutil = require('./dateutil');

module.exports = function ( options ) {

    var self = this;

    this.options = options || {};
    this.type = 'console';
    this.bIncludeSid = (options && options.bIncludeSid === false) ? false : true;
    this.defaultSid = (options && options.defaultSid) ? options.defaultSid : undefined;
    this.ready = true;
    this.bISODate = false;

    this.open = function( onSuccess ) {
        if( options && options.dateFormat === 'ISO' )
            self.bISODate = true;
        self.ready = true;
        onSuccess && onSuccess(true);
    };

    this.clear = function() {
        ;
    };

    this.flush = function() {
        ;
    };

    this.write = function( params ) {
        var msg = self._formatLogMessage( params );
        console.log( msg );
    };

    this.end = function( onClose ) {
        self.ready = false;
    };

    this.destroy = function() {
        self.end();
    };

    this.toString = function() {
        return "Console";
    };

    this._formatLogMessage = function( params ) {
        var d = self.bISODate ? params.time.toISOString() : dateutil.formatMS(params.timeDiff);
        var msg = [ d, params.level.toUpperCase() ];
        if( self.bIncludeSid ) {
            msg.push( params.reqId ? params.reqId : 0 );
            msg.push( params.sid ? params.sid : "" );
        }
        msg.push( params.module ? params.module : "" );
        msg.push( params.action ? params.action : "" );
        msg.push( params.message );
        //msg = msg.concat(params.message?params.message:"");
        if( params.data )
            msg.push( params.data );
        return JSON.stringify(msg);
/*
        var msg = util.format( "[%s %s%s] %s",
            ( self.bISODate ? params.time.toISOString() : dateutil.formatMS(params.timeDiff) ),
            String('   '+params.level).toUpperCase().substr(-Math.max(5,params.level.length)),
            ( self.bIncludeSid ? ( params.sid ? (" "+params.sid) : (self.defaultSid ? ("["+self.defaultSid+"] ") : "") ) : "" ),
            (params.module ? ( params.module + ": " ) : "") );
        if( params.message instanceof Array ) {
            msg += params.message.join("\n        ");
            msg += "\n        " + (params.action?params.action:"") + " " + JSON.stringify(params.data);
        } else {
            msg += params.message ? params.message : "";
            if( params.data )
                msg += " " + (params.action?params.action:"") + " " + JSON.stringify(params.data);
        }
        return msg;
*/
    };

};

function pad000(n){return n<10 ? '00'+n : (n<100 ? '0'+n : n);};
