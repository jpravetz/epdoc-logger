/*****************************************************************************
 * loggly.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var _ = require('underscore');
var dateutil = require('../dateutil');
var os = require('os');
var request = require('request');

/**
 * Create a new Loggly transport to output log messages to loggly.
 *
 * @param options {Object} Output options include:
 * @param [sid] {boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param token {string} - The loggly token used for authenticating to loggly.
 * @param [tags] {string[]} - Array of loggly tags.
 * @param [url] {string} - URL to use for the loggly service. Should be set only if the default URL
 *   value is not working.
 * @param [host=os.hostname()] {string} - Set the name of the host that is reported to loggly in a host column.
 * @param [timestamp=ms] {string} - Set the format for timestamp output, must be one of 'ms' or
 *   'iso'.
 * @param [format=jsonArray] {string} - Set the format for the output line. Must be one of 'json'
 *   or 'jsonArray'.
 * @param [custom=true] {boolean} - Set whether to output a 'custom' column.
 * @param [bufferSize=100] {number} - The maximum number of lines of log messages to buffer before writing to loggly.
 * @param [flushInterval=5000] {number} - The maximum number of milliseconds of buffering before writing to loggly.
 * @constructor
 */

var LogglyTransport = function (options) {
    options || (options = {});
    this.options = options;
    this.token = options.token;
    this.subdomain = 'logs-01';
    this.bIncludeSid = (options && ( options.sid === false || options.bIncludeSid === false)) ? false : true;
    this.bIncludeCustom = (options && options.custom === false ) ? false : true;
    this.tags = (_.isArray(options.tags) && options.tags.length ) ? ('/tag/' + options.tags.join(',') + '/') : '';
    this.sType = 'loggly';
    this.bReady = false;

    this.url = options.url || 'https://' + this.subdomain + '.loggly.com/bulk/' + this.token + this.tags;
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 5000;
    if (false !== options.host) {
        this.host = options.host || os.hostname();
    }
    this.buffer = [];

};

LogglyTransport.prototype = {

    constructor: LogglyTransport,

    validateOptions: function () {
        if (!_.isString(this.options.token)) {
            return new Error("Token not specified or invalid");
        }
        return null;
    },

    open: function (onSuccess, onError, onClose) {
        var self = this;
        this.onError = onError;
        this.onClose = onClose;
        this.timer = setInterval(function () {
            if (self.buffer.length) self.flush();
        }, this.flushInterval);
        this.bReady = true;
        onSuccess && onSuccess(true);
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

    flush: function (opt_cb) {
        var msgs = this.buffer;
        this.buffer = [];
        this._send(msgs, opt_cb);
    },

    /**
     * Write a log line
     * @param params {Object} Parameters to be logged:
     *  @param {Date} params.time - Date object
     * @param {string} params.level - log level (INFO, WARN, ERROR, or any string)
     * @param {string} params.reqId - express request ID, if provided (output if options.sid is true)
     * @param {string} params.sid - express session ID, if provided (output if options.sid is true)
     * @param {string} params.module - name of file or module or emitter (noun)
     * @param {string} params.action - method or operation being performed (verb)
     * @param {string} params.message - text string to output
     * @param {Object} params.custom - Arbitrary data to be logged in a 'custom' column if enabled via the LogManager.
     * @param {Object} params.data - Arbitrary data to be logged in the 'data' column
     */
    write: function (params) {
        var msg = this._formatLogMessage(params);
        // console.log('>> %j (%s/%s)', msg, this.buffer.length, this.bufferSize);
        if (this.host) {
            msg.hostname = this.host;
        }
        this.buffer.push(JSON.stringify(msg));
        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }
    },

    _send: function (msgs, cb) {
        var body = msgs.join('\n');
        var len = Buffer.byteLength(body);
        var self = this;

        // console.log('>> %d messages %s bytes', msgs.length, len);

        var opts = {
            body: body,
            uri: this.url,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': len
            }
        };

        request(opts, function (err, res) {
            // console.log('<< %s', res && res.statusCode);
            if (err && self.onError) {
                self.onError(err);
            }
            if (res && res.statusCode >= 400 && self.onError) {
                self.onError(new Error(res.statusCode + ' response'));
            }
            cb && cb(err, res);
        });
    },


    end: function (cb) {
        this.flush(function (err, res) {
            if (err) {
                console.error(err.message);
            }
            clearInterval(this.timer);
            this.bReady = false;
            this.onClose && this.onClose();
            cb && cb(err);
        });
    },

    destroy: function (cb) {
        this.end(cb);
    },

    toString: function () {
        return "loggly";
    },

    _formatLogMessage: function (params) {
        var json = {
            timestamp: (params.time ? params.time.toISOString() : (new Date()).toISOString()),
            level: params.level,
            module: params.module,
            action: params.action,
            data: params.data,
            message: params.message,
            custom: params.custom
        };
        if (this.bIncludeSid) {
            json.sid = params.sid;
            json.reqId = params.reqId;
        }
        if (this.bIncludeCustom) {
            json.custom = params.custom;
        }
        if (params.message instanceof Array) {
            json.message = params.message.join('\n');
        }
        return json;
    },

    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    last: true

};


module.exports = LogglyTransport;
