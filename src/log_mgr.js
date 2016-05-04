/*****************************************************************************
 * log_mgr.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/


var _ = require('underscore');
var util = require('util');
var Path = require('path');
var Logger = require('./logger');

var mgrIdx = 0;

/**
 * Create a new LogManager object with no transports. Logged messages will not begin
 * writing to the transport until a transport is added and [start()]{@link LogManager#start} is
 * called. To add a transport call [addTransport()]{@link LogManager#addTransport}. More than one
 * transport can be configured at the same time. Alternatively the LogManager can be started up
 * immediately by setting <code>options.autoRun</code> to true. In this situation, if
 * <code>options.transports</code> is set, then the specified transports will be used. But if
 * <code>options.transports</code> is not set, then the default {@link ConsoleTransport} is used.
 *
 * <p>It is normal to have one LogManager per application, and to call
 * [get(emitterName)]{@link LogManager#get} to get a new {@link Logger} object for each emitter and
 * then call methods on this {@link Logger} object to log messages.
 *
 * @class A LogManager is used to manage logging, including transports, startup, shutdown and
 *   various options.
 *
 * @param {Object} [options] -
 * @param {Date} [options.t0=now] - The earliest known time for when the process was started
 * @param {boolean} [options.sid=false] - Indicates whether a session ID column should be included
 *   in log output
 * @param {boolean} [options.static=false] - Indicates whether a static column should be included
 *   in log output
 * @param {string} [options.level=debug] - The log level at and above which log messages will be
 *   written
 * @param {boolean} [options.errorStack=false] - Include the error stack in the data column when
 *   writing Error objects to the log.
 * @param {Object[]} [options.transports] - Add transports now rather than calling {#addTransport}.
 *   Objects in the array contain the config for the transport and must include a <code>type</code>
 *   property.
 * @param {boolean} [options.autoRun=false] - If set to true then logging will be immediately
 *   enabled and a call to {@link LogManager#start} will not be necessary. If no transports have
 *   been provided then a default console transport will be added.
 * @param {boolean} [options.allTransportsReady=true] - If true then all transports must be ready
 *   before messages will be written. If false then any transport can be ready before flushing will
 *   occur, which may result in transports that are not ready missing some messages.
 * @constructor
 */
var LogManager = function (options) {

    options || ( options = {} );
    this.name = 'LogManager#' + (++mgrIdx);
    this.t0 = options.t0 ? options.t0.getTime() : (new Date()).getTime();
    this.sid = ( options.sid === true ) ? true : false;
    this.static = ( options.static === true ) ? true : false;
    // Count of how many errors, warnings, etc
    this.logCount = {};
    this.LEVEL_DEFAULT = 'debug';       // Default threshold level for outputting logs
    this.LEVEL_INFO = 'info';           // If changing LEVEL_ORDER, what level should internally
                                        // generated info messages be output at?
    this.LEVEL_WARN = 'warn';           // If changing LEVEL_ORDER, what level should internally
                                        // generated warn messages be output at?
    this.LEVEL_ORDER = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'];
    this.logLevel = options.level ? options.level : this.LEVEL_DEFAULT;
// A stack of tranports, with the console transport always installed by default as a fallback
    // A queue of messages that may build up while we are switching streams
    this.queue = [];
    this.bErrorStack = (options.errorStack === true) ? true : false;
// Indicates whether we have started logging or not
    this.running = false;
    this.allTransportsReady = options.allTransportsReady === false ? false : true;
    this.transports = [];
    var tarray = [];
    if (_.isArray(options.transports)) {
        tarray = options.transports;
    } else if (options.transports) {
        tarray.push(options.transports);
    }
    if (tarray.length) {
        for (var tdx = 0; tdx < tarray.length; tdx++) {
            this.addTransport(tarray[tdx]);
        }
    }
    if (options.autoRun === true) {
        if (!tarray.length) {
            this.addTransport('console');
        }
        this.start();
    }
};

LogManager.prototype = {

    constructor: LogManager,

    /**
     * Starts all transports, if not already started. This enables logs to be written to the
     * transports. It is necessary to manually start the transports if not using the default
     * transport, to allow time for the transports to be setup. Log messages will be buffered until
     * all transports are ready.
     * @param {function} [callback] Called when all transports are ready to receive messages. It is
     *   not normally necessary to wait for this callback.
     * @return {LogManager}
     */
    start: function (callback) {
        var self = this;
        if (!self.running) {
            var jobs = [];
            if (self.transports.length) {
                for (var idx = 0; idx < self.transports.length; idx++) {
                    var transport = self.transports[idx];
                    jobs.push(self._startingTransport(transport));
                }
            }
            Promise.all(jobs).then(function () {
                self.running = true;
                self.flushQueue();
                callback && callback();
            }, function (err) {
                // The transport will have removed itself and stopped the queue, so try starting
                // again with the remaining transports
                self.start(callback);
            });
        }
        return self;
    },

    /**
     * Wraps {LogManager#start} into a Promise.
     * @return {Promise} Resolves to this.
     */
    starting: function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            self.start(function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(self);
                }
            });
        });
    },

    _startingTransport: function (transport) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var name = transport.toString();
            var bResolved = false;
            transport.open(onSuccess, onError, onClose);

            function onSuccess () {
                transport.clear();
                self.logMessage(self.LEVEL_INFO, "logger.start.success", "Started transport '" + name + "'", { transport: name });
                if (!bResolved) {
                    bResolved = true;
                    resolve();
                }
                // self.flushQueue();
            }

            function onError (err) {
                self.logMessage(self.LEVEL_WARN, "logger.warn", "Tried but failed to start transport '" + name + "'. " + err);
                self.removeTransport(transport);
                if (!bResolved) {
                    bResolved = true;
                    resolve();
                }
            }

            function onClose () {
                self.logMessage(self.LEVEL_INFO, "logger.close", "Closed transport '" + name + "'");
                self.removeTransport(transport);
            }
        });
    },

    /**
     * Add a log transport. Multiple transports can be in operation at the same time, allowing log
     * messages to be sent to more than one destination.
     *
     * @param {string|Object} [type] - For the provided loggers, one of 'sos', 'file', 'callback',
     *   'console' or 'loggly'. For a custom transport this should be a transport class object that
     *   can be instantiated with 'new'. To create your own transport class, consider using
     *   getLoggerClass('console') and then subclassing this class. If the params option contains a
     *   'type' property, this field is optional.
     * @param options {Object} These are directly passed to the transport when constructing the new
     *   transport object. Please refer to the individual transport for properties. Some common
     *   properties are listed here.
     * @param [options.sid] {boolean} - If true then output express request and session IDs,
     *   otherwise do not output these values. Default is to use LogManager's sid setting.
     * @param [options.timestamp=ms] {string} - Set the format for timestamp output, must be one of
     *   'ms' or 'iso'.
     * @param [options.static=true] {boolean} - Set whether to output a 'static' column. By default
     *   this inherits the value from the LogManager.
     * @param [options.level=debug] {string} - Log level for this transport.
     * @return {LogManager}
     */
    addTransport: function (type, options) {
        var newTransport = this._getNewTransport(type, options);
        if (newTransport) {
            this.running = false;
            this.transports.unshift(newTransport);
            var name = newTransport.toString();
            var topts = newTransport.getOptions();
            var sOptions = topts ? ' (' + JSON.stringify(topts) + ')' : '';
            this.logMessage(this.LEVEL_INFO, "logger.transport.add", "Added transport '" + name + "'" + sOptions,
                { transport: name, options: topts });
        } else {
            this.logMessage(this.LEVEL_WARN, "logger.transport.add.warn",
                ("Unsupported addTransport operation: " + err.message ), { options: options });
        }
        return this;
    },

    _getNewTransport: function (type, options) {

        if (!_.isString(type)) {
            if (_.isObject(type) && type.hasOwnProperty('type')) {
                options = type;
                type = type.type;
            } else {
                options = type;
                type = undefined;
            }
        }
        options || ( options = {} );

        if (!options.sid) {
            options.sid = this.sid;
        }
        if (!options.static) {
            options.static = this.static;
        }
        if (!options.level) {
            options.level = this.logLevel;
        }

        var Transport;

        if (type) {
            var p = Path.resolve(__dirname, 'transports', type);
            Transport = require(p);
        } else if (options) {
            Transport = type;
        } else {
            var p = Path.resolve(__dirname, 'transports/console');
            Transport = require(p);
        }

        if (Transport) {
            var newTransport = new Transport(options);
            var err = newTransport.validateOptions();
            if (!err) {
                return newTransport;
            } else {
                this.logMessage(this.LEVEL_WARN, "logger.push.warn",
                    ("Unsupported setLogger operation: " + err.message ), { options: options });
            }
        }
        return this;
    },

    /**
     * Remove a particular transport. Pauses log output. The caller should call [start()]{@link
        * LogManager#start} to restart logging.
     * @param transport {string|object} If a string then all transports of this type will be
     *   removed. If an object then all transports that match the object specification will be
     *   removed. Refer to the individual classes' <code>match</code> method.
     * @param {function} [callback] The caller can wait for transports to be flushed and destroyed,
     *   but this is not necessary for normal use.
     * @return {LogManager}
     */
    removeTransport: function (transport, callback) {
        var self = this;
        this.running = false;
        var remainingTransports = [];
        var jobs = [];
        for (var idx = 0; idx < this.transports.length; idx++) {
            var t = this.transports[idx];
            if (t.match(transport)) {
                var job = new Promise(function (resolve, reject) {
                    transport.destroy(function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(err);
                        }
                    });
                });
                jobs.push(job);
                self.logMessage(self.LEVEL_INFO, "logger.transport.remove", "Removed transport '" + t.toString() + "'", { transport: t.toString() });
            } else {
                remainingTransports.push(this.transports[idx])
            }
        }
        this.transports = remainingTransports;
        if (callback) {
            Promise.all(jobs).then(callback, callback);
        }
        return this;
    },

    /**
     * Test if this is a known transport
     * @param s {string} Name of the transport
     * @returns {boolean}
     */
    isValidTransport: function (s) {
        if (_.isString(s) && ['console', 'file', 'callback', 'loggly', 'sos'].indexOf(s) >= 0) {
            return true;
        }
        return false;
    },

    /**
     * Return one of the predefined transport classes by name. If you want to define your own class,
     * it is suggested you subclass or copy one of the existing transports.
     * @returns {*} LogManager Class for which you should call new with options, or if creating
     *   your own transport you may subclass this object.
     */
    getTransportByName: function (type) {
        if (_.isString(type)) {
            return require('./transports/' + type);
        }
    },

    /**
     * Get the list of currently set transports.
     * @returns {*} The current array of transports. Call type() on the return value to determine
     *   it's type.
     */
    getTransports: function () {
        return this.transports;
    },

    /**
     * Log messages are first written to a buffer, then flushed. Calling this function will force
     * the queue to be flushed. Normally this function should not need to be called. Will only
     * flush the queue if all transports are ready to receive messages.
     * @returns {LogManager}
     * @private
     */
    flushQueue: function () {
        if (this.running && this.queue.length) {
            if (this.transports.length) {
                if (!this.allTransportsReady || this._allTransportsReady()) {
                    var nextMsg = this.queue.shift();
                    if (nextMsg) {
                        for (var idx = 0; idx < this.transports.length; idx++) {
                            var transport = this.transports[idx];
                            var logLevel = transport.level || nextMsg._logLevel || this.logLevel;
                            if (this.isAboveLevel(nextMsg.level, logLevel)) {
                                nextMsg._logLevel = undefined;
                                transport.write(nextMsg);
                            }
                        }
                        this.flushQueue();
                    }
                }
            }
        }
        return this;
    },

    /**
     * Test if all transports are ready to receive messages.
     * @returns {boolean}
     * @private
     */
    _allTransportsReady: function () {
        var result = true;
        for (var idx = 0; idx < this.transports.length; idx++) {
            var transport = this.transports[idx];
            if (!transport.ready()) {
                result = false;
            }
        }
        return result;
    },

    /**
     * Set automatically when the epdoc-logger module is initialized, but can be set manually to
     * the earliest known time that the application was started.
     * @param d {Date} The application start time
     * @return {LogManager}
     */
    setStartTime: function (d) {
        this.t0 = (new Date(d)).getTime();
        return this;
    },

    /**
     * Get the time at which the module was initialized
     * @return {Number} Start time in milliseconds
     */
    getStartTime: function () {
        return this.t0;
    },

    /**
     * Return a new module {@link Logger} object with the specified module name.
     * Although it's a new logger instance, it still uses the same underlying
     * 'writeMessageParams' method, and whatever transport is set globally by this LogManager.
     * @param {string} moduleName Name of module or file, added as a column to log output
     * @param {object} [context] A context object. For Express or koa this would have 'req' and
     *   'res' properties. The context.req may also have reqId and sid/sessionId/session.id
     *   properties that are used to populate their respective columns of output. Otherwise these
     *   columns are left blank on output.
     * @return A new {logger} object.
     */
    get: function (moduleName, context) {
        return new Logger(this, moduleName, context);
    },

    /**
     * A wrapper for logParams with a more limited set of properties.
     * @param {string} level
     * @param {string} action
     * @param {string} message
     * @param {Object} [data]
     * @return {LogManager}
     * @see {LogManager#logParams}
     */
    logMessage: function (level, action, message, data) {
        var params = { module: 'logger', level: level, action: action, message: message };
        if (data) {
            params.data = data;
        }
        return this.logParams(params);
    },

    /**
     * Write a raw message to the transport. The LogManager will buffer messages to handle the
     * situation where we are switching transports and the new transport is not yet ready. It is
     * possible to log directly to a transport using this method and never need to create a {@link
        * Logger} object.
     *
     * @param {Object} msgParams - The message to be written
     * @param {string} [msgParams.level=info] - Must be one of LEVEL_ORDER values, all lower case
     * @param {string} [msgParams.sid] - sessionID to display
     * @param {string} [msgParams.module] - Module or emitter descriptor to display (usually of
     *   form route.obj.function)
     * @param {string} [msgParams.time=now] - A date object with the current time
     * @param {string} [msgParams.timeDiff=calculated] - The difference in milliseconds between
     *   'time' and when the application was started, based on reading {@link
        *   LogManager#getStartTime}
     * @param {string|string[]} msgParams.message - A string or an array of strings. If an array
     *   the string will be printed on multiple lines where supported (e.g. SOS). The string must
     *   already formatted (e.g.. no '%s')
     * @params {string} [logLevel] - Specify the threshold log level above which to display
     *   this log message, overriding the log level set for the LogManager, but not overriding the
     *   setting set for the transport.
     * @return {LogManager}
     */
    logParams: function (msgParams, logLevel) {
        if (msgParams) {
            if (!msgParams.level) {
                msgParams.level = this.LEVEL_INFO;
            }
            // Set for later comparison
            msgParams._logLevel = logLevel || this.logLevel;
            if (!msgParams.time) {
                msgParams.time = new Date();
            }
            if (!msgParams.timeDiff) {
                msgParams.timeDiff = msgParams.time.getTime() - this.t0;
            }
            this.queue.push(msgParams);
            if (msgParams.length && msgParams.message && msgParams.message.length > msgParams.length) {
                msgParams.message = msgParams.message.substr(0, msgParams.length) + "...";
            }
            this.logCount[msgParams.level] = 1 + (this.logCount[msgParams.level] || 0);
        }
        return this.flushQueue();
    },

    /**
     * Set the {@link LogManager} objects's minimum log level.
     * @param level {string} - Must be one of {@link LogManager#LEVEL_ORDER}
     * @param [options] {Object}
     * @param [options.transports=false] {Boolean} Set the level for all transports as well.
     * @return {LogManager}
     */
    setLevel: function (level, options) {
        this.logLevel = level;
        if (this.transports) {
            for (var tdx = 0; tdx < this.transports.length; tdx++) {
                var transport = this.transports[tdx];
                transport.setLevel(level);
            }
        }
        return this;
    },

    /**
     * Return true if the level is equal to or greater then the {@link LogManager#logLevel}
     * property.
     * @param level {string} Level that is to be tested
     * @param [thresholdLevel] {string} Threshold level against which <code>level</code> is to be
     *   tested. If this is not supplied then the level will be tested against {@link
        *   LogManager#logLevel}.
     * @return {boolean}
     */
    isAboveLevel: function (level, thresholdLevel) {
        var threshold = thresholdLevel || this.logLevel;
        if (this.LEVEL_ORDER.indexOf(level) >= this.LEVEL_ORDER.indexOf(threshold)) {
            return true;
        }
        return false;
    },


    /**
     * Write a log line to the transport with a count of how many of each level of message has been
     * output. This is a useful function to call when the application is shutdown.
     * @param {string} [message]
     * @return {LogManager}
     */
    writeCount: function (message) {
        return this.logParams({
            module: 'logger',
            action: 'counts',
            data: this.logCount,
            message: message
        });
    },

    /**
     * Set whether to show an error stack as data when an Error is encountered.
     * This option can also be set in the {@link LogManager} constructor. The property is
     * referenced by {@link Logger} objects when they are created, and is used by the {@link
        * Logger} to determine whether to output an error stack trace in the data column when an
     * Error is logged.
     * @param {boolean} [bShow=true] Set whether to log the call stack for logged errors.
     * @returns {LogManager}
     */
    errorStack: function (bShow) {
        this.bErrorStack = (bShow === false) ? false : true;
        return this;
    },

    /**
     * Return a count object containing a count of the number of log messages produced at the
     * various log levels defined in {@link LogManager#LEVEL_ORDER}.
     * @returns {Object} with properties for 'warn', 'info', etc. where the value of each property
     *   is a number.
     */
    getCount: function () {
        return this.logCount;
    },

    /**
     * Performs a managed shutdown of the logging service. This is relevant if using a buffered
     * logger such as the loggly transport. If called when shutting down an application, the caller
     * should wait for buffers to be flushed and the callback to be called before exiting.
     * @param {function} [callback] - Called with err when complete.
     * @returns {Promise}
     */
    destroying: function (callback) {
        this.running = false;
        var jobs = [];
        while (this.transports.length) {
            var transport = this.transports.shift();
            if (transport) {
                var job = new Promise(function (resolve, reject) {
                    transport.destroy(function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
                jobs.push(job);
            }
        }
        return Promise.all(jobs).then(function () {
            callback && callback();
            return Promise.resolve();
        }, function (err) {
            callback && callback(err);
            return Promise.reject(err);
        });
    },

    /**
     * Flush the buffers for all transports.
     * @param {function} [callback] - Called with err when complete.
     * @returns {Promise}
     */
    flushing: function (callback) {
        var jobs = [];
        _.each(this.transports, function (transport) {
            var job = new Promise(function (resolve, reject) {
                transport.flush(function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
            jobs.push(job);
        });
        return Promise.all(jobs).then(function () {
            callback && callback();
            return Promise.resolve();
        }, function (err) {
            callback && callback(err);
            return Promise.reject(err);
        });
    }

};

module.exports = LogManager;
