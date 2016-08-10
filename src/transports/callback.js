/*****************************************************************************
 * transports/callback.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var _ = require('underscore');
var format = require('./../format');

/**
 * Create a new Callback transport where output is added to a data array or a callback is used to
 * pass thru the log message. Used for testing.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param [options.level] {string} - Log level above which to output log messages, overriding
 *   setting for LogManager.
 * @param {function} [options.callback] - Callback with object to be logged rather than adding to
 *   line buffer
 * @param {function} [options.uid] - Unique identifier used by {@link CallbackTransport#match}.
 * @constructor
 */
var CallbackTransport = function (options) {
    this.options = options || {};
    this.bIncludeSid = (options && options.sid === false) ? false : true;
    this.bIncludeStatic = (options && options.static === false ) ? false : true;
    this.level = this.options.level;
    this.sType = 'callback';
    this.bReady = true;
    this.logCallback = options.callback;
    this.uid = options.uid;
    this.data = [];
};

CallbackTransport.prototype = {

    constructor: CallbackTransport,


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
     * Test if the transport matches the argument.
     * @param transport {string|object} If a string, then matches if equal to 'callback'. If an
     *   object, then matches if transport.type equals 'callback' and if transport.uid matches.
     * @returns {boolean} True if the transport matches the argument
     */
    match: function (transport) {
        if (_.isString(transport) && transport === this.sType) {
            return true;
        }
        if (_.isObject(transport) && transport.type === this.sType) {
            if (transport.uid == this.uid) {
                return true;
            }
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
        this.data = [];
    },

    flush: function (cb) {
        cb && cb();
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
        var opts = {
            timestamp: 'iso',
            sid: this.bIncludeSid,
            static: this.bIncludeStatic,
            dataObjects: true
        };
        var json = format.paramsToJson(params,opts);
        if (this.logCallback) {
            this.logCallback(json);
        } else {
            this.data.push(json);
        }
    },

    end: function (cb) {
        this.bReady = false;
        cb && cb();
    },

    destroy: function (cb) {
        this.end();
        cb && cb();
    },

    setLevel: function(level) {
        this.level = level;
    },

    toString: function () {
        return "Callback" + (this.uid ? (" (" + this.uid + ")") : "");
    },

    getOptions: function() {
        return undefined;
    },

    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    last: true

};


module.exports = CallbackTransport;
