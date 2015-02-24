/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var dateutil = require('../dateutil');
var _ = require('underscore');
var Path = require('path');
var fs = require('fs');

// Number of lines of output to buffer. If this value is exceeded then buffer is written immediately to the file
const MAX_BUFFER = 32;

// We will subclass the ConsoleTransport
var Transport = require('./console');

var protoProps = {

    sType: 'file',
    buffer: [],     // Used in case of stream backups
    writable: true,

    validateOptions: function (previous) {
        if (_.isString(this.options.path)) {
            if (previous && previous.type() === 'sos') {
                return new Error("Cannot switch from 'sos' logger to 'file' logger");
            }
            var parentFolder = Path.dirname(this.options.path);
            if( !fs.existsSync(parentFolder) ) {
                return new Error("Log folder '" + parentFolder + "' does not exist");
            }
        }
        return null;
    },

    open: function (onSuccess, onError, onClose) {
        try {
            this.stream = fs.createWriteStream(this.options.path, {flags: 'a'});
            this.bReady = true;
            this.stream
            onSuccess && onSuccess();
        } catch (err) {
            onError && onError(err);
        }
        this.stream.on('error', function (err) {
            onError && onError(err);
        });
        this.stream.on('close', function () {
            this.bReady = false;
            onClose && onClose();
        });
    },

    write: function (params) {
        var msg = this._formatLogMessage(params);
        this._write(msg + "\n");
    },

    _write: function (msg) {
        if (this.writable) {
            this.writable = this.stream.write(msg, 'ascii');
        } else {
            this.buffer.push(msg);
            this.stream.once('drain', this.flush);
        }
    },

    /**
     * Used only if buffering (if options.buffer is > 0)
     * Flushes everything in the buffer and starts a timer to automatically
     * flush again after options.buffer time
     */
    flush: function () {
        if (this.buffer.length) {
            var flushing = this.buffer;
            this.buffer = [];
            for (var idx = 0; idx < flushing.length; ++idx) {
                this._write(flushing[idx]);
            }
        }
    },

    end: function () {
        this.flush();
        this.bReady = false;
        if (this.stream) {
            this.stream.end();
        }
    },

    destroy: function () {
        this.end();
        if (this.stream) {
            this.stream.destroy();
        }
        this.stream = undefined;
    },

    _formatLogMessage: function (params) {
        var d = this.bISODate ? params.time.toISOString() : dateutil.formatMS(params.timeDiff);
        var msg = [d, params.level.toUpperCase()];
        if (this.bIncludeSid) {
            msg.push(params.reqId ? params.reqId : 0);
            msg.push(params.sid ? params.sid : "");
        }
        msg.push(params.module ? params.module : "");
        msg.push(params.action ? params.action : "");
        msg.push(params.message);
        //msg = msg.concat(params.message?params.message:"");
        if (params.data) {
            msg.push(params.data);
        }
        return JSON.stringify(msg);
    },

    toString: function () {
        return "File (" + this.options.path + ")";
    },

    last: true

};

var FileTransport = function (options) {
    Transport.call(this, options);
};

FileTransport.prototype = Object.create(Transport.prototype);
FileTransport.prototype.constructor = FileTransport;

_.extend(FileTransport.prototype, protoProps);

module.exports = FileTransport;

