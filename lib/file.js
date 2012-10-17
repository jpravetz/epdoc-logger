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
    var self = {

        type: 'file',
        ready: false,
        stream: undefined,

        open: function( options, onSuccess, onError, onClose) {
            var FS = require('fs');
            try {
                self.stream = FS.createWriteStream( options.path, { flags: 'a' } );
                self.path = options ? options.path : undefined;
                self.ready = true;
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
        },

        clear: function() {
            ;   // Not supported
        },

        write: function( params ) {
            var msg = _formatLogMessage( params );
            self.stream.write( msg );
        },

        end: function() {
            if( self.stream )
                self.stream.end();
        },

        destroy: function() {
            if( self.stream )
                self.stream.destroy();
            self.stream = undefined;
        },

        toString: function() {
            return "File (" + ( self.path ? self.path : "null" ) + ")";
        }
    }

    function _formatLogMessage( params ) {
        var msg = util.format( "[%s] %s: %s", dateutil.formatMS(params.timeDiff),
            String(params.level).toUpperCase(), (params.module ? ( params.module + ": " ) : "") );
        if( typeof params.msg === 'string' ) {
            msg += params.msg + "\n";
        } else {
            msg += params.msg.join("\n        ") + "\n";
        }
        return msg;
    };

    return self;
};