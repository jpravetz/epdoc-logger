/*****************************************************************************
 * format.js
 * CONFIDENTIAL Copyright 2012-2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/

var dateutil = require('../../dateutil');

var self = {

    /**
     * General method to format parameters into a JSON object.
     * @param params {Object} Parameters to be logged:
     * @param {Date} params.time - Date object
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
     * @param options {Object}
     * @param [options.timestamp=ms] {string} Timestamp output format
     * @param [options.sid=ms] {string} Include session info
     * @param [options.custom=ms] {string} include custom
     * @returns {Object}
     */
    paramsToJson: function (params, options) {
        options || ( options = {});
        var json = {
            timestamp: self.getTimestamp(params, options.timestamp),
            level: params.level,
            emitter: params.module,
            action: params.action,
            data: options.dataObjects ? params.data : JSON.stringify(params.data),
            message: params.message,
            custom: options.dataObjects ? params.custom : JSON.stringify(params.custom)
        };
        if (options.levelMap && options.levelMap.verbose && json.level === 'VERBOSE') {
            json.level = options.levelMap.verbose;
        }
        if( options.levelUppercase ) {
            json.level = json.level.toUpperCase();
        }
        if (options.sid) {
            json.sid = params.sid;
            json.reqId = params.reqId;
        }
        if (options.custom) {
            json.custom = params.custom;
        }
        if (params.message instanceof Array) {
            json.message = params.message.join('\n');
        }
        return json;
    },

    /**
     * General method to format parameters into a JSON Array.
     * @param params {Object} Parameters to be logged:
     * @param {Date} params.time - Date object
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
     * @param options {Object}
     * @param [options.timestamp=ms] {string} Timestamp output format
     * @param [options.sid=ms] {string} Include session info
     * @param [options.custom=ms] {string} include custom
     * @returns {Object}
     */
    paramsToJsonArray: function (params, options) {
        var json = [self.getTimestamp(params, options.timestamp), params.level.toUpperCase()];
        if (options.sid) {
            json.push(params.reqId ? params.reqId : 0);
            json.push(params.sid ? params.sid : "");
        }
        json.push(params.module ? params.module : "");
        json.push(params.action ? params.action : "");
        json.push(params.message);
        //json = json.concat(params.message?params.message:"");
        if (options.custom) {
            json.push(params.custom ? params.custom : {});
        }
        if (params.data) {
            json.push(params.data);
        }
        return json;
    },

    getTimestamp: function (params, format) {
        if (format === 'smstime') {
            return String(params.time.getTime());
        } else if (format === 'iso') {
            return params.time.toISOString();
        } else {
            return dateutil.formatMS(params.timeDiff);
        }
    },

    pad: function (n, width, z) {
        z = z || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

};

module.exports = self;
