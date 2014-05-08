/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
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
            self.buffer.push( msg + "\n" );
            if( self.buffer.length > MAX_BUFFER )
                self.flush();
        } else {
            self.stream.write( msg + "\n" );
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
    };

};