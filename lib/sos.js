/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var net = require('net');
var util = require('util');

module.exports = function ( options ) {

    var self = this;

    this.options = options || {};
    this.type = 'sos';
    this.bIncludeSid = (options && options.bIncludeSid === false) ? false : true;
    this.defaultSid = (options && options.defaultSid) ? options.defaultSid : undefined;
    this.socket = undefined;
    this.ready = false;

    this.open = function( onSuccess, onError, onClose) {
        console.log( "SOS: Attempting connection")
        self.socket = net.connect( { port: 4444 }, function() {
            console.log( "SOS: Connected");
            self.ready = true;
            onSuccess && onSuccess();
        } );
        self.socket.on('error',function(err){
            onError && onError(err);
        });
        self.socket.on('close',function(){
            self.ready = false;
            onClose && onClose();
        });
    };

    this.clear = function() {
        console.log( "SOS: Clearing SOS console");
        self.socket.write( "!SOS<clear/>\0" );
    };

    this.flush = function() {
        ;
    };

    this.write = function( params ) {
        var msg = self._formatLogMessage( params );
        self.socket.write( msg );
    };

    this.end = function() {
        if( self.socket )
            self.socket.end();
        self.ready = false;
    };

    this.destroy = function() {
        self.end();
        if( self.socket )
            self.socket.destroy();
        self.socket = undefined;
    };

    this.toString = function() {
        return "SOS Socket (port 4444)";
    };

    this._formatLogMessage = function( params ) {
        var msg = "";
        var json = [ params.module ? params.module : "", params.action ? params.action : "" ];
        if( self.bIncludeSid ) {
            json.unshift( params.sid ? params.sid : "" );
            json.unshift( params.reqId ? params.reqId : 0 );
        }
        if( params.message instanceof Array ) {
            json.push( params.message.shift() );
            if( params.data ) json.push( params.data );
            msg = util.format(
                '!SOS<showFoldMessage key="%s"><title><![CDATA[%s]]></title>',
                params.level,
                JSON.stringify(json)
            );
            msg += "<message><![CDATA[" + params.message.join("\n") + "]]></message></showFoldMessage>\0";
        } else {
            json.push( params.message ? params.message : "" );
            if( params.data ) json.push( params.data );
            msg = util.format(
                '!SOS<showMessage key="%s"><![CDATA[%s]]></showMessage>\0',
                params.level,
                JSON.stringify(json) );
        }
        return msg;
    };

};