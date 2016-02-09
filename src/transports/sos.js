/*****************************************************************************
 * sos.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var net = require('net');
var util = require('util');
var _ = require('underscore');

// We will subclass the ConsoleTransport
var Transport = require('./console');

var protoProps = {

    sType: 'sos',
    socket: undefined,

    validateOptions: function( previous ) {
        if( previous && previous.type === 'sos' ) {
            return new Error("Cannot switch from 'sos' logger to 'sos' logger");
        }
        return null;
    },

    open: function( onSuccess, onError, onClose ) {
        console.log("SOS: Attempting connection");
        this.socket = net.connect({port: 4444}, function() {
            console.log("SOS: Connected");
            this.bReady = true;
            onSuccess && onSuccess();
        });
        this.socket.on('error', function( err ) {
            onError && onError(err);
        });
        this.socket.on('close', function() {
            this.bReady = false;
            onClose && onClose();
        });
    },

    clear: function() {
        console.log("SOS: Clearing SOS console");
        this.socket.write("!SOS<clear/>\0");
    },

    write: function( params ) {
        var msg = this._formatLogMessage(params);
        this.socket.write(msg);
    },

    end: function(cb) {
        if( this.socket ) {
            this.socket.end();
        }
        this.bReady = false;
        cb && cb();
    },

    destroy: function(cb) {
        this.end();
        if( this.socket ) {
            this.socket.destroy();
        }
        this.socket = undefined;
        cb && cb();
    },

    toString: function() {
        return "SOS Socket (port 4444)";
    },

    _formatLogMessage: function( params ) {
        var msg = "";
        var json = [params.module ? params.module : "", params.action ? params.action : ""];
        if( this.bIncludeSid ) {
            json.unshift(params.sid ? params.sid : "");
            json.unshift(params.reqId ? params.reqId : 0);
        }
        if( params.message instanceof Array ) {
            json.push(params.message.shift());
            if( params.data ) {
                json.push(params.data);
            }
            msg = util.format(
                '!SOS<showFoldMessage key="%s"><title><![CDATA[%s]]></title>',
                params.level,
                JSON.stringify(json)
            );
            msg += "<message><![CDATA[" + params.message.join("\n") + "]]></message></showFoldMessage>\0";
        } else {
            json.push(params.message ? params.message : "");
            if( params.data ) {
                json.push(params.data);
            }
            msg = util.format(
                '!SOS<showMessage key="%s"><![CDATA[%s]]></showMessage>\0',
                params.level,
                JSON.stringify(json));
        }
        return msg;
    },

    last: true

};

var SOSTransport = function(options) {
    Transport.call(this,options);
};

SOSTransport.prototype = Object.create(Transport.prototype);
SOSTransport.prototype.constructor = SOSTransport;

_.extend(SOSTransport.prototype, protoProps);

module.exports = SOSTransport;
