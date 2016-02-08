/*****************************************************************************
 * line.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

var _ = require('underscore');
var dateutil = require('../dateutil');

/**
 * Create a new line transport where output is added to a lines array.
 * Used for testing.
 * @param options Output options include:
 *      dateFormat = If "ISO" then output time as an ISO Date, otherwise output as time offset from app launch
 *      bIncludeSid = If true then output express request and session IDs, otherwise do not output these values
 *      buffer = Interval in milliseconds to flush buffer (used for transports that buffer)
 * @constructor
 */
var LineTransport = function (options) {
    this.options = options || {};
    this.bIncludeSid = (options && options.bIncludeSid === false) ? false : true;
    this.bISODate = ( options && options.dateFormat === 'ISO') ? true : false;
    this.sType = 'line';
    this.bReady = true;
    this.lines = [];
    this.data = [];
};

LineTransport.prototype = {

    constructor: LineTansport,


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
        this.lines = [];
        this.data = [];
    },

    flush: function () {
    },

    /**
     * Write a log line to the lines array, and the params to the data array.
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
        data.push(params);
        var msg = this._formatLogMessage(params);
        lines.push(msg);
    },

    end: function (onClose) {
        this.bReady = false;
    },

    destroy: function () {
        this.end();
    },

    toString: function () {
        return "Console";
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

    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    last: true

};


module.exports = LineTransport;