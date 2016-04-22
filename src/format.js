/*****************************************************************************
 * format.js
 * CONFIDENTIAL Copyright 2012-2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/

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
        if (options.levelUppercase) {
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
            return self.formatMS(params.timeDiff);
        }
    },

    /**
     *
     * @param n {number} number to pad with leading zeros.
     * @param width {number} total width of string (eg. 3 for '005').
     * @param [z='0'] {char} character with which to pad string.
     * @returns {String}
     */
    pad: function (n, width, z) {
        z = z || '0';
        n = String(n);
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    formatMS: function (ms) {
        var milliseconds = ms % 1000;
        var seconds = Math.floor(ms / 1000) % 60;
        var minutes = Math.floor(ms / ( 60 * 1000 ));
        return self.pad(minutes, 2) + ':' + self.pad(seconds, 2) + '.' + self.pad(milliseconds, 3);
    },


    /**
     * Handle  various types of error messages, including MongooseError
     * @param err
     * @returns {string}
     */
    errorToStringArray: function (err) {
        if (err instanceof Error) {
            var msgs = [err.message];
            if (err.errors instanceof Array) {
                for (var idx = 0; idx < err.errors.length; ++idx) {
                    var e = err.errors[idx];
                    if (typeof e === 'string') {
                        msgs.push(e);
                    } else if (_.isString(e.message)) {
                        msgs.push(e.message);
                    }
                }
            } else if (err.errors instanceof Object && Object.keys(err.errors).length) {
                Object.keys(err.errors).forEach(function (name) {
                    var e = err.errors[name];
                    if (typeof e === 'string') {
                        msgs.push(e);
                    } else if (typeof e.message === 'string') {
                        msgs.push(e.message);
                    }
                });
            }
            return msgs;
        }
    }

};

module.exports = self;
