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

        type: 'console',
        ready: true,

        open: function(fn) {
            fn && fn(true);
        },

        clear: function() {
            ;
        },

        write: function( params ) {
            var msg = _formatLogMessage( params );
            console.log( msg );
        },

        end: function() {
            ;
        },

        destroy: function() {
            ;
        }
    }

    function _formatLogMessage( params ) {
        var msg = util.format( "[%s] %s: %s: %s", dateutil.formatMS(params.timeDiff), String(params.level).toUpperCase(),
            (params.module ? params.module : ""),params.msg );
        return msg;
    };

    return self;
};