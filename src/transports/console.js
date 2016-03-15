/*****************************************************************************
 * console.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var _ = require('underscore');
var dateutil = require('../dateutil');

/**
 * Create a new console transport.
 * @param options Output options include:
 *   dateFormat = If "ISO" then output time as an ISO Date, otherwise output as time offset from
 *        app launch
 *   sid = If true then output express request and session IDs, otherwise do not output these values
 *   buffer = Interval in milliseconds to flush buffer (used for transports that buffer)
 * @constructor
 */
var ConsoleTransport = function (options) {
    this.options = options || {};
    this.bIncludeSid = (options && ( options.sid === false || options.bIncludeSid === false) ) ? false : true;
    this.bIncludeCustom = (options && options.custom === false ) ? false : true;
    this.bISODate = ( options && options.timestamp && options.timestamp.match(/^iso$/i) ) ? true : false;
    this.sType = 'console';
    this.bReady = true;
};

ConsoleTransport.prototype = {

    constructor: ConsoleTransport,

    validateOptions: function () {
        return null;
    },

    open: function (onSuccess) {
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

    flush: function (cb) {
        cb && cb();
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
        console.log(msg);
    },

    end: function (cb) {
        this.bReady = false;
        cb && cb();
    },

    destroy: function (cb) {
        this.end();
        cb && cb();
    },

    toString: function () {
        return "Console";
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

    /**
     * General method, not used by console, but used by other transports, to format the parameters
     * into a JSON objecvt.
     * @param params
     * @returns {{timestamp: *, level: *, module: (string|*), action, data: *, message, custom: *}}
     * @private
     */
    _paramsToJson: function (params) {
        var json = {
            timestamp: params.time.toISOString(),
            level: params.level.toUpperCase(),
            emitter: params.module,
            action: params.action,
            data: JSON.stringify(params.data),
            message: params.message,
            custom: JSON.stringify(params.custom)
        };
        if (json.level === 'VERBOSE') {
            json.level = 'TRACE';
        }
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

    _paramsToJsonArray: function (params) {
        var d = this.bISODate ? params.time.toISOString() : dateutil.formatMS(params.timeDiff);
        var json = [d, params.level.toUpperCase()];
        if (this.bIncludeSid) {
            json.push(params.reqId ? params.reqId : 0);
            json.push(params.sid ? params.sid : "");
        }
        json.push(params.module ? params.module : "");
        json.push(params.action ? params.action : "");
        json.push(params.message);
        //json = json.concat(params.message?params.message:"");
        if (this.bIncludeCustom) {
            json.push(params.custom ? params.custom : {});
        }
        if (params.data) {
            json.push(params.data);
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


module.exports = ConsoleTransport;
