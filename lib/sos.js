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

        open: function(fn) {
            console.log( "Connecting")

            self.socket = net.connect( { port: 4444 } );
            self.socket.on('connect',function(){
                console.log( "Connect success")
                fn && fn(true);
            });
            self.socket.on('error',function(){
                console.log( "Connect fail")
                fn && fn(false);
            });
        },

        clear: function() {
            console.log( "Doing clear")
            self.socket.write( "!SOS<clear/>\0" );
        },

        write: function(moduleName,level,msg,timeDiffMS) {
            var msg = _formatLogMessage(moduleName,level,msg);
            self.socket.write( msg, function(){
                console.log('Data written');
            });
        },

        send2: function() {
            self.socket.write("!SOS<showMessage key='error'>The Message!</showMessage>\0",function() {
                console.log('Data written');
            });
        },

        close: function() {
            self.socket.end();
        }
    }

    function _formatLogMessage( moduleName,level,msg ) {
        var msg = util.format( '!SOS<showMessage key="%s"><![CDATA[%s: %s]]></showMessage>\0',
            level, moduleName, msg );
        return msg;
    };

    return self;
};