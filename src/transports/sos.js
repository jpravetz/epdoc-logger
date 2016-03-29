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

    sType: 'socket',
    socket: undefined,
    port: 5000,

    validateOptions: function( previous ) {
        if( previous && previous.type === 'socket' ) {
            return new Error("Cannot switch from 'socket' logger to 'socket' logger");
        }
        return null;
    },

    open: function( onSuccess, onError, onClose ) {
        var self = this;
        console.log("Socket: Attempting connection to port " + self.port);
        this.socket = net.connect({port: self.port}, function() {
            console.log("Socket: Connected to port " + self.port);
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

    isEqual: function(transport) {
        return transport.type === 'sos' && transport.port === this.port ? true : false
    },

    clear: function() {
        console.log("Socket: Clearing Socket console");
        if( this.options.format === 'sos' ) {
            this.socket.write("!SOS<clear/>\0");
        }
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
        return "Socket (port " + this.port + ")";
    },

    _formatLogMessage: function (params) {
        if( this.options.format === 'sos' ) {
            return this._paramsToSOS(params);
        } else if (this.options.format === 'json') {
            var json = this._paramsToJson(params);
            return JSON.stringify(json);
        } else {
            var json = this._paramsToJsonArray(params);
            return JSON.stringify(json);
        }
    },

    /**
     * General method, not used by console, but used by other transports, to format the parameters
     * into a JSON objecvt.
     * @param params
     * @returns {{timestamp: *, level: *, module: (string|*), action, data: *, message, custom: *}}
     * @private
     */
    _paramsToSOS: function (params) {
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

var LogMXSocketTransport = function(options) {
    Transport.call(this,options);
};

LogMXSocketTransport.prototype = Object.create(Transport.prototype);
LogMXSocketTransport.prototype.constructor = LogMXSocketTransport;

_.extend(LogMXSocketTransport.prototype, protoProps);

module.exports = LogMXSocketTransport;
