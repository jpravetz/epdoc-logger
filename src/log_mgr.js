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
 * Create a new LogManager using the default ConsoleTransport. The logger will not begin writing
 * to the transport unless you set autoRun = true or call setTransport or call start.
 * To use a different transport, set the transport using setTransport('file').
 * You will likely have one LogManager per application, then call logMgr.get() to get a log
 * object which you will use for logging messages.
 * @param options {Object} { autoRun: false, sid: false, custom: boolean, level: string,
 *   transport: { string } Note that if transport has any parameters, you should set it using the
 *   setTransport method.
 * @constructor
 */
var LogManager = function (options) {

    options || ( options = {} );
    this.t0 = options.t0 ? options.t0.getTime() : (new Date()).getTime();
    this.logLevel = options.level ? options.level : 'debug';
    this.sid = ( options.sid === true ) ? true : false;
    this.custom = ( options.custom === true ) ? true : false;
    // Count of how many errors, warnings, etc
    this.logCount = {};
    this.LEVEL_ORDER = ['verbose', 'debug', 'info', 'warn', 'error', 'fatal'];
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
     * @private
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
                    self.logMessage("info", "logger.push.success", "Set logger to " + transportName, { transport: transportName });
                    self.flushQueue();
                };

                function onError (err) {
                    self.logMessage("warn", "logger.push.warn", "Tried but failed to set logger to " + transportName + ": " + err);
                    self.unsetTransport();
                };

                function onClose () {
                    self.logMessage("info", "logger.push.close", "Transport " + transportName + " closed");
                    self.unsetTransport();
                }
            } else {
                this.logMessage("warn", "logger.start.error", "Cannot start current transport because no more transports in stack");
            }
        }
        return self;
    },

    /**
     * Set log target by unshifting the provided transport object onto the list of transports.
     * The default transport, before any is unshifted onto the list of transports, is the console
     * transport. If you add a transport (eg. file transport) then later remove it, the previously
     * set logger (eg. console) will be used.
     * @param type - For the provided loggers, one of 'sos', 'file', 'line', or 'console'. For a
     *   custom transport this hsould be a transport class object that can be instantiated with
     *   'new'. To create your own transport class, use getLoggerClass('console') and then subclass
     *   this class.
     * @param options are passed to the transport when constructing the new transport object.
     *   Options for the predefined transports are:
     *      path {string} path to file, used by file transport
     *      timestamp {string} one of 'iso', 'smstime' or 'ms', defaults to 'ms' but may be overriden by
     *   transport requirements (e.g. loggly uses iso) sid {boolean} whether to include sessionId and reqId
     *   columns in log output (used with express and other request/response apps), overrides
     *   LogMgr setting. custom {boolean} Indicates whether to include 'custom' column or not,
     *   overrides LogMgr setting.
     *
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
                this.logMessage("info", "logger.push", "Setting logger to " + newTransportName, { transport: newTransportName });
                var currentTransport = this.getCurrentTransport();
                if (currentTransport) {
                    currentTransport.end();
                }
                this.transports.unshift(newTransport);
                this.running = false;

                this.start();

            } else {
                this.logMessage("warn", "logger.push.warn", ("Unsupported setLogger operation: " + err.message ), { options: options });
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
     * Set automatically when this moduel is initialized, but can be set manually to the earliest
     * known time that the application was started.
     * @param d
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
     * Return a new module logger object instance using the specified module name.
     * Although it's a new logger instance, it still uses the same underlying
     * 'writeMessageParams' method, and whatever transport is set globally.
     * @param moduleName Name of module or file, added as a column to log output
     * @param opt_context {object} A context object. For Express or koa this would have 'req' and
     *   'res' properties. The context.req may also have reqId and sid/sessionId/session.id
     *   properties that are used to populate their respective columns of output. Otherwise these
     *   columns are left blank on output.
     * @return A new logger object.
     */
    get: function (moduleName, opt_context) {
        return new Logger(this, moduleName, opt_context);
    },

    /**
     * Same as logParams with just these parameters set.
     * @param level
     * @param action
     * @param msg
     * @param data
     */
    logMessage: function (level, action, message, data) {
        var params = { module: 'logger', level: level, action: action, message: message };
        if (data) {
            params.data = data;
        }
        return this.logParams(params);
    },

    /**
     * Write a raw message. We queue messages to handle the moment in time while we are switching
     * streams and the new stream is not ready yet. We do queuing while we wait for it to be ready.
     * You can completely bypass creating a logger instance in your class if you use this call
     * directly, In this situation the log level filtering will be established by the log level
     * (this.logLevel).
     * @param msgParams includes:
     *      level - Must be one of LEVEL_ORDER values, all lower case
     *      sid - (Optional) sessionID to display
     *      module - (Optional) Module descriptor to display (usually of form route.obj.function)
     *      time - (Optional) A date object with the current time, will be filled in if not
     *   provided
     *      timeDiff - (Optional) The difference in milliseconds between 'time' and when the
     *   application was started, based on reading LogManager.getStartTime() message - A string or
     *   an array of strings. If an array the string will be printed on multiple lines where
     *   supported (e.g. SOS). The string must already formatted (e.g.. no '%s')
     */
    logParams: function (msgParams) {
        if (msgParams) {
            if (!msgParams.level) {
                msgParams.level = 'info';
            }
            if (this.isAboveLevel(msgParams.level)) {
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
     * Set the LogManager objects's minimum log level
     * @param level {string} Must be one of LEVEL_ORDER
     */
    setLevel: function (level) {
        this.logLevel = level;
        return this;
    },

    /**
     * Return true if the level is equal to or greater then the LogManager's logLevel property.
     */
    isAboveLevel: function (level) {
        if (this.LEVEL_ORDER.indexOf(level) >= this.LEVEL_ORDER.indexOf(this.logLevel)) {
            return true;
        }
        return false;
    },


    /**
     * Write a count of how many of each level of message has been output.
     * This is a useful function to call when the application is shutdown.
     */
    writeCount: function (opt_msg) {
        return this.logParams({
            module: 'logger',
            action: 'counts',
            data: this.logCount,
            message: opt_msg
        });
    },

    errorStack: function (bShow) {
        this.bErrorStack = (bShow === false) ? false : true;
        return this;
    },

    /**
     * Return a count object
     * @returns {Object} with properties for 'warn', 'info', etc.
     */
    getCount: function () {
        return this.logCount;
    },

    // Do a managed shutdown. This is important if using a buffered logger such as our loggly
    // implementation.
    destroying: function () {
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
        return Promise.all(jobs)
    },

    /**
     * Flush the queue of the current transport
     * @returns {Promise}
     */
    flushing: function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var transport = self.getCurrentTransport();
            if (transport) {
                transport.flush(function (err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            } else {
                resolve();
            }
        });
    },

    /**
     * Shortcut to util.format()
     */
    format: function () {
        return util.format.apply(this, arguments);
    }

};

module.exports = LogManager;
