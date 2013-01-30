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

const MAX_BUFFER = 100; // To keep our buffer memory use from getting out of hand

module.exports = function (options) {

    var self = this;

    this.options = options || {};
    this.type = 'file';
    this.bIncludeSid = (options && options.bIncludeSid === false) ? false : true;
    this.defaultSid = (options && options.defaultSid) ? options.defaultSid : undefined;
    this.bJson = (options && options.json === true ) ? true : false;
    this.ready = false;
    this.stream = undefined;
    this.bISODate = true;
    this.buffer;

    this.open = function( onSuccess, onError, onClose) {
        if( options && options.dateFormat === 'ISO' )
            self.bISODate = true;
        else if( options && options.dateFormat === 'formatMS' )
            self.bISODate = false;
        var FS = require('fs');
        try {
            self.stream = FS.createWriteStream( options.path, { flags: 'a' } );
            self.ready = true;
            if( options && options.buffer && typeof options.buffer === 'number' ) {
                self.buffer = [];
                setInterval(function() { self.flush() }, options.buffer );
            }
            onSuccess && onSuccess();
        } catch(err) {
            onError && onError(err);
        }
        self.stream.on('error',function(err){
            onError && onError(err);
        });
        self.stream.on('close',function(){
            self.ready = false;
            onClose && onClose();
        });
    };

    this.clear = function() {
        ;   // Not supported
    };

    this.write = function( params ) {
        var msg = self._formatLogMessage( params );
        if( self.buffer ) {
            self.buffer.push( msg );
            if( self.buffer.length > MAX_BUFFER )
                self.flush();
        } else {
            self.stream.write( msg );
        }
    };

    this.flush = function() {
        if (self.buffer.length) {
            self.stream.write(self.buffer.join(''), 'ascii');
            self.buffer.length = 0;
        }
    }

    this.end = function() {
        self.flush();
        self.ready = false;
        if( self.stream )
            self.stream.end();
    };

    this.destroy = function() {
        self.end();
        if( self.stream )
            self.stream.destroy();
        self.stream = undefined;
    };

    this.toString = function() {
        return "File (" + ( options ? options.path : "null" ) + ")";
    };

    this._formatLogMessage = function( params ) {
        var d = self.bISODate ? params.time.toISOString() : dateutil.formatMS(params.timeDiff);
        if( self.bJson ) {
            var msg = [ d, params.level.toUpperCase() ];
            if( self.bIncludeSid )
                msg.push( params.sid ? params.sid : "" );
            msg.push( params.module ? params.module : "" );
            msg = msg.concat(params.message?params.message:"");
            if( params.data ) {
                msg.push( params.action ? params.action : "" );
                msg.push( params.data );
            }
            return JSON.stringify(msg) + "\n";
        } else {
            var msg = util.format( "[%s %s%s] %s",
                d,
                String('   '+params.level).toUpperCase().substr(-Math.max(5,params.level.length)),
                ( self.bIncludeSid ? ( params.sid ? (" "+params.sid) : (self.defaultSid ? (" "+self.defaultSid) : "") ) : "" ),
                (params.module ? ( params.module + ": " ) : "") );
            if( params.message instanceof Array ) {
                msg += params.message.join("\n        ");
                if( params.data )
                    msg += "\n        " + (params.action?params.action:"") + " " + JSON.stringify(params.data);
            } else {
                if( params.message )
                    msg += params.message;
                if( params.data )
                    msg += " " + (params.action?params.action:"") + " " + JSON.stringify(params.data);
            }
            return msg + "\n";
        }
    };

};