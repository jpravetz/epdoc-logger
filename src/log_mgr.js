/*****************************************************************************
 * log_mgr.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/


var _ = require('underscore');
var util = require('util');
var Path = require('path');
var Logger = require('./logger');
var ConsoleStream = require('./transports/console');


/**
 * Create a new LogManager object with a default ConsoleTransport. Logged messages will not begin
 * writing to the transport until {@link LogManager#start} or {@link LogManager#setTransport} is
 * called. To use a different transport, set the transport using setTransport('file'). You will
 * likely have one LogManager per application, then call logMgr.get() to get a log object which you
 * will use for logging messages.
 *
 * @class A LogManager is used to manage logging, including transports, startup, shutdown and
 *   various options.
 *
 * @param {Object} [options] -
 * @param {Date} [options.t0=now] - The earliest known time for when the process was started
 * @param {boolean} [options.sid=false] - Indicates whether a session ID column should be included
 *   in log output
 * @param {boolean} [options.custom=false] - Indicates whether a custom column should be included
 *   in log output
 * @param {string} [options.level=debug] - The log level at and above which log messages will be
 *   written
 * @param {boolean} [options.errorStack=false] - Include the error stack in the data column when
 *   writing Error objects to the log.
 * @param {Object} [options.transport] - Set the transport now rather than calling {#setTransport}.
 *   This object contains the config for the transport and must include a type property.
 * @param {string} options.transport.type - The name of the transport
 * @param {boolean} [autoRun=false] - If set to true then logging will be immediately enabled and a
 *   call to {@link LogManager#start} will not be necessary.
 * @constructor
 */
var LogManager = function (options) {

    options || ( options = {} );
    this.t0 = options.t0 ? options.t0.getTime() : (new Date()).getTime();
    this.sid = ( options.sid === true ) ? true : false;
    this.custom = ( options.custom === true ) ? true : false;
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
    // Indicates whether we have started logging or not
    this.running = false;
    this.transports = [new ConsoleStream()];
    if (options.transport) {
        this.setTransport(options.transport);
    }
    this.bErrorStack = (options.errorStack === true) ? true : false;
    if (options.autoRun === true) {
        this.start();
    }
};

LogManager.prototype = {

    constructor: LogManager,

    /**
     * Starts the transport at the head of the transport stack, if not already started. This starts
     * logging. This is done manually because we may hold of logging until the transport is set.
     * @return {LogManager}
     */
    start: function () {
        var self = this;
        if (!self.running) {
            var currentTransport = this.getCurrentTransport();

            if (currentTransport) {
                var transportName = currentTransport.toString();
                currentTransport.open(onSuccess, onError, onClose);

                function onSuccess () {
                    self.running = true;
                    currentTransport.clear();
                    self.logMessage(self.LEVEL_INFO, "logger.push.success", "Set logger to " + transportName, { transport: transportName });
                    self.flushQueue();
                };

                function onError (err) {
                    self.logMessage(self.LEVEL_WARN, "logger.push.warn", "Tried but failed to set logger to " + transportName + ": " + err);
                    self.unsetTransport();
                };

                function onClose () {
                    self.logMessage(self.LEVEL_INFO, "logger.push.close", "Transport " + transportName + " closed");
                    self.unsetTransport();
                }
            } else {
                this.logMessage(self.LEVEL_WARN, "logger.start.error", "Cannot start current transport because no more transports in stack");
            }
        }
        return self;
    },

    /**
     * Set log target by unshifting the provided transport object onto the list of transports.
     * The default transport, before any is unshifted onto the list of transports, is the console
     * transport. If you add a transport (eg. file transport) then later remove it, the previously
     * set logger (eg. console) will be used.
     *
     * @param {string|Object} type - For the provided loggers, one of 'sos', 'file', 'line', or
     *   'console'. For a custom transport this should be a transport class object that can be
     *   instantiated with
     *   'new'. To create your own transport class, use getLoggerClass('console') and then subclass
     *   this class.
     * @param options are passed to the transport when constructing the new transport object.
     *   Options for the predefined transports are:
     *      path {string} path to file, used by file transport
     *      timestamp {string} one of 'iso', 'smstime' or 'ms', defaults to 'ms' but may be
     *   overriden by transport requirements (e.g. loggly uses iso) sid {boolean} whether to
     *   include sessionId and reqId columns in log output (used with express and other
     *   request/response apps), overrides LogMgr setting. custom {boolean} Indicates whether to
     *   include 'custom' column or not, overrides LogMgr setting.
     *
     * @return {LogManager}
     */
    setTransport: function (type, options) {

        if (!_.isString(type)) {
            if (_.isObject(type) && type.hasOwnProperty('type')) {
                options = type;
                type = type.type;
            } else {
                options = type;
                type = undefined;
            }
        }

        if (!options.sid) {
            options.sid = this.sid;
        }
        if (!options.custom) {
            options.custom = this.custom;
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
            var err = newTransport.validateOptions(newTransport);
            if (!err) {
                var newTransportName = newTransport.toString();
                this.logMessage(this.LEVEL_INFO, "logger.push", "Setting logger to " + newTransportName, { transport: newTransportName });
                var currentTransport = this.getCurrentTransport();
                if (currentTransport) {
                    currentTransport.end();
                }
                this.transports.unshift(newTransport);
                this.running = false;

                this.start();

            } else {
                this.logMessage(this.LEVEL_WARN, "logger.push.warn", ("Unsupported setLogger operation: " + err.message ), { options: options });
            }
        }
        return this;
    },

    /**
     * Unset the last logger. The latest logger is shifted off the list of loggers.
     */
    unsetTransport: function () {
        this.running = false;
        if (this.transports.length > 1) {
            var discardTransport = this.transports.shift();
            discardTransport.destroy();
        }
        return this.start();
    },

    isValidTransport: function (s) {
        if (_.isString(s) && ['console', 'file', 'line', 'loggly', 'sos'].indexOf(s) >= 0) {
            return true;
        }
        return false;
    },

    /**
     * Return one of the predefined transport objects. If you want to define your own class,
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
     * Get the current transport logger.
     * @returns {*} The current transport, a subclass of console.js. Call type() on the return value
     * to determine it's type.
     */
    getCurrentTransport: function () {
        return this.transports.length ? this.transports[0] : undefined;
    },

    flushQueue: function () {
        var currentTransport = this.getCurrentTransport();
        if (this.running && currentTransport && currentTransport.ready()) {
            var nextMsg = this.queue.shift();
            if (nextMsg) {
                currentTransport.write(nextMsg);
                this.flushQueue();
            }
        }
        return this;
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
     * @params {string} [thresholdLevel] - Specify the threshold log level above which to display
     *   this log message, overriding the log level set for the LogManager.
     * @return {LogManager}
     */
    logParams: function (msgParams, thresholdLevel) {
        if (msgParams) {
            if (!msgParams.level) {
                msgParams.level = this.LEVEL_INFO;
            }
            if (this.isAboveLevel(msgParams.level, thresholdLevel)) {
                if (!msgParams.time) {
                    msgParams.time = new Date();
                }
                if (!msgParams.timeDiff) {
                    msgParams.timeDiff = msgParams.time.getTime() - this.t0;
                }
                this.queue.push(msgParams);
            }
            if (msgParams.length && msgParams.message && msgParams.message.length > msgParams.length) {
                msgParams.message = msgParams.message.substr(0, msgParams.length) + "...";
            }
            this.logCount[msgParams.level] = 1 + (this.logCount[msgParams.level] || 0);
        }
        return this.flushQueue();
    },

    /**
     * Set the {@link LogManager} objects's minimum log level
     * @param level {string} - Must be one of {@link LogManager#LEVEL_ORDER}
     * @return {LogManager}
     */
    setLevel: function (level) {
        this.logLevel = level;
        return this;
    },

    /**
     * Return true if the level is equal to or greater then the {@link LogManager#logLevel}
     * property.
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
     * This option can also be set in {@link LogManager#constructor}. The property is referenced by
     * {@link Logger} objects when they are created, and is used by the Logger to determine whether
     * to output an Error stack trace in the data column when an Error is logged.
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
     * logger such as the loggly transport.
     * @param {function} [callback] - Called with err when complete.
     * @returns {Promise}
     */
    destroying: function (callback) {
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
     * Flush the queue of the current transport.
     * @param {function} [callback] - Called with err when complete.
     * @returns {Promise}
     */
    flushing: function (callback) {
        var self = this;
        return new Promise(function (resolve, reject) {
            var transport = self.getCurrentTransport();
            if (transport) {
                transport.flush(function (err) {
                    if (err) {
                        callback && callback(err);
                        reject(err);
                    } else {
                        callback && callback();
                        resolve();
                    }
                })
            } else {
                callback && callback();
                resolve();
            }
        });
    }

};

module.exports = LogManager;
