/*****************************************************************************
 * loggly.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var _ = require('underscore');
var dateutil = require('../dateutil');
var os = require('os');
var request = require('request');

/**
 * Create a new console transport.
 * @param options Output options include:
 *      dateFormat = If "ISO" then output time as an ISO Date, otherwise output as time offset from
 *   app launch bIncludeSid = If true then output express request and session IDs, otherwise do not
 *   output these values buffer = Interval in milliseconds to flush buffer (used for transports
 *   that buffer)
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
     * @param params Object with the following properties:
     *      time = Date object
     *      level = log level (INFO, WARN, ERROR, or any string)
     *      reqId = express request ID, if provided (output if bIncludeSid is true)
     *      sid = express session ID, if provided (output if bIncludeSid is true)
     *      module = name of file or module (noun)
     *      action = method or operation being performed (verb)
     *      message = text string to output
     *      data = JSON object
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
