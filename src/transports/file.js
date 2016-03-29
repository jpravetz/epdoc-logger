/*****************************************************************************
 * file.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var _ = require('underscore');
var Path = require('path');
var fs = require('fs');
var format = require('./util/format');


/**
 * Create a new File transport to output log messages to a file.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param options.path {string} - The path to the output file to append to.
 * @param [options.timestamp=ms] {string} - Set the format for timestamp output, must be one of
 *   'ms' or
 *   'iso'.
 * @param [options.format=jsonArray] {string} - Set the format for the output line. Must be one of
 *   'json' or 'jsonArray'.
 * @param [options.custom=true] {boolean} - Set whether to output a 'custom' column.
 * @constructor
 */

var FileTransport = function (options) {
    this.options = options || {};
    this.bIncludeSid = (options && ( options.sid === false || options.bIncludeSid === false) ) ? false : true;
    this.bIncludeCustom = (options && options.custom === false ) ? false : true;
    this.timestampFormat = this.options.timestamp || 'ms';
    this.sType = 'file';
    this.bReady = true;
    this.buffer = [];      // Used in case of stream backups
    this.writable = true;
};

FileTransport.prototype = {

    constructor: FileTransport,

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
            if (!fs.existsSync(folder)) {
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

    type: function () {
        return this.sType;
    },

    /**
     * Return true if this logger is ready to accept write operations.
     * Otherwise the caller should buffer writes and call write when ready is true.
     * @returns {boolean}
     */
    ready: function () {
        return this.bReady;
    },

    /**
     * Used to clear the logger display. This is applicable only to certain transports, such
     * as socket transports that direct logs to a UI.
     */
    clear: function () {
    },

    /**
     * Write a log line
     * @param params {Object} Parameters to be logged:
     *  @param {Date} params.time - Date object
     * @param {string} params.level - log level (INFO, WARN, ERROR, or any string)
     * @param {string} params.reqId - express request ID, if provided (output if options.sid is
     *   true)
     * @param {string} params.sid - express session ID, if provided (output if options.sid is true)
     * @param {string} params.module - name of file or module or emitter (noun)
     * @param {string} params.action - method or operation being performed (verb)
     * @param {string} params.message - text string to output
     * @param {Object} params.custom - Arbitrary data to be logged in a 'custom' column if enabled
     *   via the LogManager.
     * @param {Object} params.data - Arbitrary data to be logged in the 'data' column
     */
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
        var opts = {
            timestamp: this.timestampFormat,
            sid: this.bIncludeSid,
            custom: this.bIncludeCustom
        };
        if (this.options.format === 'json') {
            var json = format.paramsToJson(params,opts);
            return JSON.stringify(json);
        } else {
            var json = format.paramsToJsonArray(params,opts);
            return JSON.stringify(json);
        }
    },

    toString: function () {
        return "File (" + this.options.path + ")";
    },

    last: true

};

module.exports = FileTransport;

