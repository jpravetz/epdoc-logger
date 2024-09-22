/*****************************************************************************
 * transports/loggly.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var _ = require('underscore');
var os = require('os');
var request = require('request');

/**
 * Create a new Loggly transport to output log messages to loggly.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param [options.level] {string} - Log level above which to output log messages, overriding
 *   setting for LogManager.
 * @param options.token {string} - The loggly token used for authenticating to loggly.
 * @param [options.tags] {string[]} - Array of loggly tags.
 * @param [options.url] {string} - URL to use for the loggly service. Should be set only if the
 *   default URL value is not working.
 * @param [options.host=os.hostname()] {string} - Set the name of the host that is reported to
 *   loggly in a host column.
 * @param [options.timestamp=ms] {string} - Set the format for timestamp output, must be one of
 *   'ms' or 'iso'.
 * @param [options.static=true] {boolean} - Set whether to output a 'static' column.
 * @param [options.bufferSize=100] {number} - The maximum number of lines of log messages to buffer
 *   before writing to loggly.
 * @param [options.flushInterval=5000] {number} - The maximum number of milliseconds of buffering
 *   before writing to loggly.
 * @constructor
 */

var LogglyTransport = function (options) {
    options || (options = {});
    this.options = options;
    this.token = options.token;
    this.subdomain = 'logs-01';
    this.bIncludeSid = (options && ( options.sid === false || options.bIncludeSid === false)) ? false : true;
    this.bIncludeStatic = (options && options.static === false ) ? false : true;
    this.level = this.options.level;
    this.aTags = ['epdoc'];
    if (_.isArray(options.tags) && options.tags.length) {
        this.aTags = this.aTags.concat(options.tags);
    } else if (_.isString(options.tags)) {
        this.aTags.push(options.tags);
    }
    this.tags = '/tag/' + this.aTags.join(',') + '/';
    this.sType = 'loggly';
    this.bReady = false;

    this.url = options.url || 'https://' + this.subdomain + '.loggly.com/bulk/' + this.token + this.tags;
    this.bufferSize = options.bufferSize || 100;
    this.maxBufferSize = options.maxBufferSize || 1000;
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
     * Test if the transport matches the argument.
     * @param transport {string|object} If a string then matches if equal to 'loggly'. If an object
     *   then matches if transport.type equals 'loggly' and transport.token equals this transports
     *   token property.
     * @returns {boolean} True if the transport matches the argument
     */
    match: function (transport) {
        if (_.isString(transport) && transport === this.sType) {
            return true;
        }
        if (_.isObject(transport) && transport.type === this.sType && transport.token === this.token) {
            return true;
        }
        return false;
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
     * @param {string} params.emitter - name of file or module or emitter (noun)
     * @param {string} params.action - method or operation being performed (verb)
     * @param {string} params.message - text string to output
     * @param {Object} params.static - Arbitrary data to be logged in a 'static' column if enabled
     *   via the LogManager.
     * @param {Object} params.data - Arbitrary data to be logged in the 'data' column
     */
    write: function (params) {
        this._write(params);
        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }
    },

    _write: function (params) {
        var msg = this._formatLogMessage(params);
        if (this.host) {
            msg.hostname = this.host;
        }
        if (this.buffer.length < this.maxBufferSize) {
            this.buffer.push(JSON.stringify(msg));
        } else if (this.buffer.length === this.maxBufferSize) {
            var params = {
                level: 'warn',
                emitter: 'logger.transport.loggly',
                action: "buffer.limit.exceeded.dropping.messages",
                message: "Loggly buffer limit exceeded. Dropping messages."
            };
            var msg = this._formatLogMessage(params);
            if (this.host) {
                msg.hostname = this.host;
            }
            this.buffer.push(JSON.stringify(msg));
        } else {
            // drop the message on the floor
        }
    },

    flush: function (opt_cb) {
        var self = this;
        var msgs = self.buffer;
        self.buffer = [];
        self._send(msgs, function (err) {
            if (err) {
                var params = {
                    level: 'warn',
                    emitter: 'logger.transport.loggly',
                    action: "send.warning.will.retry",
                    message: "Error sending message to loggly . " + err
                };
                self.buffer = msgs.concat(self.buffer);
                // write without forcing an immediate flush, giving possible time for error
                // conditions to disappear
                self._write(params);
            }
            opt_cb && opt_cb();
        });
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
            if (!err && res && res.statusCode >= 400) {
                err = new Error(res.statusCode + ' response');
            }
            cb && cb(err, res);
        });
    },


    /**
     * Flushes the queue and closes the connections to loggly.
     * @param cb
     */
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

    stop: function (cb) {
        this.end(cb);
    },

    setLevel: function (level) {
        this.level = level;
    },

    toString: function () {
        return "Loggly";
    },

    getOptions: function () {
        return {tags: this.aTags};
    },

    _formatLogMessage: function (params) {
        var json = {
            timestamp: (params.time ? params.time.toISOString() : (new Date()).toISOString()),
            level: params.level,
            emitter: params.emitter,
            action: params.action,
            data: params.data
        };
        if (params.message) {
            if (typeof params.message === 'string' && params.message.length) {
                json.message = params.message;
            } else if (params.message instanceof Array) {
                json.message = params.message.join('\n');
            }
        }
        if (this.bIncludeSid) {
            json.sid = params.sid;
            json.reqId = params.reqId;
        }
        if (this.bIncludeStatic) {
            json.static = params.static;
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
