/*****************************************************************************
 * transports/console.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var _ = require('underscore');
var format = require('./../format');

/**
 * Create a new Console transport to output log messages to the console.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {Boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param [options.colorize=true] {Boolean} - Set to true to enable colorize formatted output.
 * @param [options.template] {String} - Provide a template string to use for output when
 *   options.format is 'string', substitutes ${ts} %{level} ${emitter} type strings, where '%'
 *   indicates string should be colorized.
 * @param [options.timestamp=ms] {String} - Set the format for timestamp output, must be one of
 *   'ms' or 'iso'.
 * @param [options.format=jsonArray] {String|function} - Set the format for the output line. Must
 *   be one of 'json', 'jsonArray', 'template', or a function that takes params and options as
 *   parameters.
 * @param [options.static=true] {Boolean} - Set whether to output a 'static' column.
 * @param [options.level] {String} - Log level above which to output log messages, overriding
 *   setting for LogManager.
 * @constructor
 */

var ConsoleTransport = function (options) {
    this.options = options || {};
    this.bIncludeSid = ( this.options.sid === false || this.options.bIncludeSid === false) ? false : true;
    this.bIncludeStatic = ( this.options.static === false ) ? false : true;
    this.colorize = (this.options.colorize !== false);
    this.timestampFormat = this.options.timestamp || 'ms';
    this.level = this.options.level;
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
     * Test if the transport matches the argument.
     * @param transport {string|object} If a string then matches if equal to 'console'. If an object
     *   then matches if transport.type equals 'console'.
     * @returns {boolean} True if the transport matches the argument
     */
    match: function (transport) {
        if (_.isString(transport) && transport === this.sType) {
            return true;
        }
        if (_.isObject(transport) && transport.type === this.sType) {
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

    flush: function (cb) {
        cb && cb();
    },

    /**
     * Write a log line
     * @param params {Object} Parameters to be logged:
     * @param {Date} params.time - Date object
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
        var msg = this._formatLogMessage(params);
        console.log(msg);
    },

    end: function (cb) {
        this.bReady = false;
        cb && cb();
    },

    stop: function (cb) {
        this.end();
        cb && cb();
    },

    setLevel: function (level) {
        this.level = level;
    },

    toString: function () {
        return "Console";
    },

    getOptions: function () {
        return undefined;
    },

    _formatLogMessage: function (params) {
        var opts = {
            timestamp: this.timestampFormat,
            sid: this.bIncludeSid,
            static: this.bIncludeStatic,
            colorize: this.colorize,
            template: this.options.template
        };
        if (_.isFunction(this.options.format)) {
            return this.options.format(params, opts);
        } else if (this.options.format === 'template') {
            return format.paramsToString(params, opts);
        } else if (this.options.format === 'json') {
            var json = format.paramsToJson(params, opts);
            return JSON.stringify(json);
        } else {
            var json = format.paramsToJsonArray(params, opts);
            return JSON.stringify(json);
        }
    }

};


module.exports = ConsoleTransport;
