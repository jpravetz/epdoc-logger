/*****************************************************************************
 * file.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var dateutil = require('../dateutil');
var _ = require('underscore');
var Path = require('path');
var fs = require('fs');

// Number of lines of output to buffer. If this value is exceeded then buffer is written
// immediately to the file
const MAX_BUFFER = 32;

// We will subclass the ConsoleTransport
var Transport = require('./console');

var protoProps = {

    validateOptions: function (previous) {
        if (_.isString(this.options.path)) {
            if (previous && previous.type() === 'sos') {
                return new Error("Cannot switch from 'sos' logger to 'file' logger");
            }
            //var parentFolder = Path.dirname(this.options.path);
            //if (!fs.existsSync(parentFolder)) {
            //    return new Error("Log folder '" + parentFolder + "' does not exist");
            //}
        } else {
            return new Error("File not specified");
        }
    },

    open: function (onSuccess, onError, onClose) {
        try {
            var folder = Path.dirname(this.options.path);
            if (!fs.existsSync(folder)){
                fs.mkdirSync(folder);
            }
            this.stream = fs.createWriteStream(this.options.path, { flags: 'a' });
            this.bReady = true;
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
            if (!this.drainRegistered) {
                this.stream.once('drain', this.flush);
                this.drainRegistered = true;
            }
        }
    },

    /**
     * Used only if buffering (if options.buffer is > 0)
     * Flushes everything in the buffer and starts a timer to automatically
     * flush again after options.buffer time
     */
    flush: function (cb) {
        this.drainRegistered = false;
        if (this.buffer.length) {
            var flushing = this.buffer;
            this.buffer = [];
            for (var idx = 0; idx < flushing.length; ++idx) {
                this._write(flushing[idx]);
            }
        }
        cb && cb();
    },

    end: function (cb) {
        this.flush();
        this.bReady = false;
        if (this.stream) {
            this.stream.end();
        }
        cb && cb();
    },

    destroy: function (cb) {
        this.end();
        if (this.stream) {
            this.stream.destroy();
        }
        this.stream = undefined;
        cb && cb();
    },

    _formatLogMessage: function (params) {
        if (this.options.format === 'json') {
            var json = this._paramsToJson(params);
            return JSON.stringify(json);
        } else {
            var json = this._paramsToJsonArray(params);
            return JSON.stringify(json);
        }
    },

    toString: function () {
        return "File (" + this.options.path + ")";
    },

    last: true

};


var FileTransport = function (options) {
    Transport.call(this, options);
    this.sType = 'file';
    this.buffer = [];      // Used in case of stream backups
    this.writable = true;

};

FileTransport.prototype = Object.create(Transport.prototype);
FileTransport.prototype.constructor = FileTransport;

_.extend(FileTransport.prototype, protoProps);

module.exports = FileTransport;

