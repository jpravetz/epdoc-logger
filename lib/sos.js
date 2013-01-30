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
        if( params.message instanceof Array ) {
            msg = util.format(
                '!SOS<showFoldMessage key="%s"><title><![CDATA[%s%s: %s%s]]></title>',
                params.level,
                ( self.bIncludeSid ? ( params.sid ? ("["+params.sid+"] ") : (self.defaultSid ? ("["+self.defaultSid+"] ") : "") ) : "" ),
                params.module,
                params.message.shift(),
                params.data ? ( " " + JSON.stringify(params.data) ) : ""
            );
            msg += "<message><![CDATA[" + params.message.join("\n") + "]]></message></showFoldMessage>\0";
        } else {
            msg = util.format(
                '!SOS<showMessage key="%s"><![CDATA[%s%s: %s%s]]></showMessage>\0',
                params.level,
                ( (self.bIncludeSid && params.sid) ? ( "[" + params.sid + "] ") : "" ),
                params.module,
                params.message ? params.message : "",
                params.data ? ( " " + JSON.stringify(params.data) ) : ""
            );
        }
        return msg;
    };

};