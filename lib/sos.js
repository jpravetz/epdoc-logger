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

module.exports = function () {
    var self = {

        type: 'sos',
        socket: undefined,
        ready: false,

        open: function(onSuccess,onError,onClose) {
            console.log( "SOS: Attempting connection")
            self.socket = net.connect( { port: 4444 }, function() {
                console.log( "SOS: Connected");
                self.ready = true;
                onSuccess && onSuccess();
            } );
            self.socket.on('error',function(){
                console.log( "SOS: Connection failed")
                onError && onError();
            });
            self.socket.on('end',function(){
                console.log( "SOS: Connection ended")
//                fn && fn(false);
            });
            self.socket.on('timeout',function(){
                console.log( "SOS: Connection timeout")
//                fn && fn(false);
            });
            self.socket.on('close',function(){
                console.log( "SOS: Connection closed");
                self.ready = false;
                onClose && onClose();
            });
        },

        clear: function() {
            console.log( "SOS: Clearing SOS console");
            self.socket.write( "!SOS<clear/>\0" );
        },

        write: function( params ) {
            var msg = _formatLogMessage( params );
            self.socket.write( msg );
        },

        close: function() {
            if( self.socket )
                self.socket.end();
        }
    }

    function _formatLogMessage( params ) {
        var msg = util.format( '!SOS<showMessage key="%s"><![CDATA[%s: %s]]></showMessage>\0',
            params.level, params.module, params.msg );
        return msg;
    };

    return self;
};