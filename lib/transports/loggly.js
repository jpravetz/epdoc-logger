/*************************************************************************
 * Copyright(c) 2012-2015 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var _ = require('underscore');
var loggly = require('loggly');

// We will subclass the ConsoleTransport
var Transport = require('./console');

var protoProps = {

    sType: 'loggly',
    client: undefined,

    validateOptions: function( previous ) {
        if( previous && previous.type === 'loggly' ) {
            return new Error("Cannot switch from 'loggly' logger to 'loggly' logger");
        }
        return null;
    },

    open: function( onSuccess, onError, onClose ) {
        console.log("Loggly: Attempting connection");
        var client = loggly.createClient({
            token: "your-really-long-input-token",
            subdomain: "your-subdomain",
            auth: {
                username: "your-username",
                password: "your-password"
            },
        this.socket = net.connect({port: 4444}, function() {
            console.log("Loggly: Connected");
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
        console.log("Loggly: Clearing Loggly console");
        this.socket.write("!Loggly<clear/>\0");
    },

    write: function( params ) {
        var msg = this._formatLogMessage(params);
        this.socket.write(msg);
    },

    end: function() {
        if( this.socket ) {
            this.socket.end();
        }
        this.bReady = false;
    },

    destroy: function() {
        this.end();
        if( this.socket ) {
            this.socket.destroy();
        }
        this.socket = undefined;
    },

    toString: function() {
        return "Loggly Socket (port 4444)";
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
