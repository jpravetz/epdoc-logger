import { isArray, isString } from '@epdoc/typeutil';
import { defaultLogLevelDef, LogLevel, LogLevelValue } from './level';
import { ColorStyle, Style } from './styles';
import { LogTransport, TransportFunctions } from './transports/base';
import { TransportFactory } from './transports/factory';
import {
  consoleTransportDefaults,
  isTransportOptions,
  LoggerRunOpts,
  LoggerShowOpts,
  LogMessage,
  LogMgrDefaults,
  LogMgrOpts,
  SeparatorOpts,
  TransportOptions
} from './types';

let Path = require('node:path');
let Logger = require('./logger');

let mgrIdx = 0;

/**
 * Create a new LogManager object with no transports. Logged messages will not begin
 * writing to the transport until a transport is added and [start()]{@link LogManager#start} is
 * called. Pass in configuration options to configure the logger and transports.
 *
 * <p>To manually add a transport call [addTransport()]{@link LogManager#addTransport}. More than
 * one transport can be configured at the same time. Alternatively the LogManager can be started up
 * immediately by setting <code>options.autoRun</code> to true. In this situation, if
 * <code>options.transports</code> is set, then the specified transports will be used. But if
 * <code>options.transports</code> is not set, then the default {@link ConsoleTransport} is used.
 *
 * <p>It is normal to have one LogManager per application, and to call
 * [get(emitterName)]{@link LogManager#getLogger} to get a new {@link Logger} object for each
 * emitter and then call methods on this {@link Logger} object to log messages.
 *
 * <p>Refer to {@link LogManager#setOptions} for options documentation.
 *
 * @class A LogManager is used to manage logging, including transports, startup, shutdown and
 *   various options.
 * @constructor
 */

export class LogManager {
  name: string;
  t0: number;
  transportFactory: TransportFactory = new TransportFactory();
  protected _defaults: LogMgrDefaults;
  protected _logLevels: LogLevel;
  transports: LogTransport[] = [];
  consoleOptions: any;
  running: boolean;
  runOpts: LoggerRunOpts;
  allTransportsReady: boolean;

  separator: SeparatorOpts;
  _style: Style;

  queue: any[];
  levelThreshold: LogLevelValue;
  errorStackThreshold: LogLevelValue;
  show: LoggerShowOpts;

  constructor(options: LogMgrOpts) {
    this.t0 = options.t0 ? options.t0.getTime() : new Date().getTime();
    this.name = 'LogManager#' + ++mgrIdx;
    this.running = false;
    this.runOpts = options.run ?? { autoRun: true };
    // Count of how many errors, warnings, etc
    this._logLevels = new LogLevel(options.logLevels ?? defaultLogLevelDef);
    if (options.defaults) {
      this.separator = options.defaults.separatorOpts ?? { char: '#', length: 70 };
      this.show = options.defaults.show ?? {};
      this._style = options.defaults.style ?? new ColorStyle();
      this.levelThreshold = options.defaults.levelThreshold ?? this._logLevels.asValue('info');
      this.errorStackThreshold =
        options.defaults.errorStackThreshold ?? this._logLevels.asValue('debug');
    }
    this.addTransports(options.transports);

    if (this.runOpts.autoRun) {
      this.start();
    }
  }

  public addTransports(transports: TransportOptions | TransportOptions[]) {
    if (isArray(transports)) {
      transports.forEach((transport) => {
        this.addTransport(transport);
      });
    } else if (isTransportOptions(transports)) {
      this.addTransport(transports);
    } else {
      this.addTransport(consoleTransportDefaults);
    }
  }
  /**
   * Starts all transports, if not already started. This enables logs to be written to the
   * transports. It is necessary to manually start the transports if not using the default
   * transport, to allow time for the transports to be setup. Log messages will be buffered until
   * all transports are ready. If there are no transports configured then this method will
   * add the console transport to ensure that there is at least one transport.
   * @param {function} [callback] Called when all transports are ready to receive messages. It is
   *   not normally necessary to wait for this callback.
   * @return {LogManager}
   */
  public async start(): Promise<any> {
    if (!this.running) {
      let jobs = [];
      this.transports.forEach((transport) => {
        let job = this.startingTransport(transport);
        jobs.push(job);
      });
      return Promise.all(jobs)
        .then(() => {
          this.running = true;
          return this.flushQueue();
        })
        .catch((err) => {
          // The transport will have removed itself and stopped the queue, so try starting
          // again with the remaining transports
          return this.start();
        });
    } else {
      return Promise.resolve();
    }
  }

  /**
   * Wraps {LogManager#start} into a Promise.
   * @return {Promise} Resolves to this.
   */
  starting(): Promise<any> {
    return this.start();
  }

  private startingTransport(transport): Promise<any> {
    let self = this;
    return new Promise(function (resolve, reject) {
      let name = transport.name;
      let bResolved = false;

      const cb: TransportFunctions = {
        onSuccess: () => {
          transport.clear();
          this.logMessage(
            this.LEVEL_INFO,
            'logger.start.success',
            "Started transport '" + name + "'",
            { transport: name }
          );
          if (!bResolved) {
            bResolved = true;
            resolve(true);
          }
        },
        onError: (err) => {
          this.logMessage(
            this.LEVEL_WARN,
            'logger.warn',
            "Tried but failed to start transport '" + name + "'. " + err
          );
          this.removeTransport(transport);
          if (!bResolved) {
            bResolved = true;
            resolve(true);
          }
        },
        onClose: () => {
          this.logMessage(this.LEVEL_INFO, 'logger.close', "Closed transport '" + name + "'");
          this.removeTransport(transport);
        }
      };

      transport.open(cb);
    });
  }

  /**
   * Add a log transport. Multiple transports can be in operation at the same time, allowing log
   * messages to be sent to more than one destination.
   * If you are adding a transport while logging is on, you should first call logMgr.stopping,
   * add the transport, then call logMgr.start.
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
  addTransport(options: TransportOptions) {
    let newTransport = this.transportFactory.getTransport(options);
    if (newTransport) {
      this.running = false;
      this.transports.unshift(newTransport);
      let name = newTransport.name;
      let topts = newTransport.getOptions();
      let sOptions = topts ? ' (' + JSON.stringify(topts) + ')' : '';
      this.logMessage({
        action: 'logger.transport.add',
        message: "Added transport '" + name + "'" + sOptions,
        data: { transport: newTransport.name }
      });
    }
    return this;
  }

  _getNewTransport(options: TransportOptions) {
    const type = options.name;

    if (!isString(type)) {
      if (_.isObject(type) && type.hasOwnProperty('type')) {
        options = type;
        type = type.type;
      } else {
        options = type;
        type = undefined;
      }
    }
    options || (options = {});

    if (_.isUndefined(options.sid)) {
      options.sid = this.sid;
    }
    if (_.isUndefined(options.static)) {
      options.static = this.static;
    }
    if (_.isUndefined(options.level)) {
      options.level = this.levelThreshold;
    }

    let Transport;
    let name = '';

    if (type) {
      let p = Path.resolve(__dirname, 'transports', type);
      Transport = require(p);
      name = type;
    } else if (options) {
      Transport = type;
    } else {
      let p = Path.resolve(__dirname, 'transports/console');
      Transport = require(p);
      name = 'console';
    }

    if (Transport) {
      let newTransport = new Transport(options);
      let err = newTransport.validateOptions();
      if (!err) {
        return newTransport;
      } else {
        this.logMessage(
          this.LEVEL_WARN,
          'logger.transport.add.warn',
          "Could not add transport '" + name + "'. " + err.message,
          { options: options }
        );
        return;
      }
    }
    return this;
  }

  /**
   * Remove a particular transport. Pauses log output. The caller should call [start()]{@link
   * LogManager#start} to restart logging.
   * @param transport {string|object} If a string then all transports of this type will be
   *   removed. If an object then all transports that match the object specification will be
   *   removed. Refer to the individual classes' <code>match</code> method.
   * @param {function} [callback] The caller can wait for transports to be flushed and destroyed,
   *   but this is not necessary for normal use.
   * @return {Promise}
   */
  removeTransport(transport, callback) {
    let self = this;
    this.running = false;
    let remainingTransports = [];
    let jobs = [];
    for (let idx = 0; idx < this.transports.length; idx++) {
      let t = this.transports[idx];
      if (t.match(transport)) {
        let job = new Promise(function (resolve, reject) {
          t.stop(function (err) {
            if (err) {
              reject(err);
            } else {
              resolve(err);
            }
          });
        });
        jobs.push(job);
        this.logMessage(
          this.LEVEL_INFO,
          'logger.transport.remove',
          "Removed transport '" + t.toString() + "'",
          { transport: t.toString() }
        );
      } else {
        remainingTransports.push(this.transports[idx]);
      }
    }
    this.transports = remainingTransports;
    return Promise.all(jobs).then(
      function () {
        callback && callback();
      },
      function (err) {
        callback && callback(err);
      }
    );
  }

  /**
   * Test if this is a known transport
   * @param s {string} Name of the transport
   * @returns {boolean}
   */
  isValidTransport(s) {
    if (isString(s) && ['console', 'file', 'callback', 'loggly', 'sos'].indexOf(s) >= 0) {
      return true;
    }
    return false;
  }

  /**
   * Return one of the predefined transport classes by name. If you want to define your own class,
   * it is suggested you subclass or copy one of the existing transports.
   * @returns {*} LogManager Class for which you should call new with options, or if creating
   *   your own transport you may subclass this object.
   */
  // getTransportByName(type) {
  //   if (isString(type)) {
  //     return require('./transports/' + type);
  //   }
  // }

  /**
   * Get the list of currently set transports.
   * @returns {*} The current array of transports. Call type() on the return value to determine
   *   it's type.
   */
  getTransports() {
    return this.transports;
  }

  /**
   * Log messages are first written to a buffer, then flushed. Calling this function will force
   * the queue to be flushed. Normally this function should not need to be called. Will only
   * flush the queue if all transports are ready to receive messages.
   * @returns {LogManager}
   * @private
   */
  flushQueue(): Promise<any> {
    if (this.running && this.queue.length) {
      if (this.transports.length) {
        if (!this.allTransportsReady || this._allTransportsReady()) {
          let nextMsg = this.queue.shift();
          if (nextMsg) {
            this.transports.forEach((transport) => {
              let logLevel = transport.level || nextMsg._logLevel || this.levelThreshold;
              if (this.isAboveLevel(nextMsg.level, logLevel)) {
                nextMsg._logLevel = undefined;
                transport.write(nextMsg);
              }
            });
            this.flushQueue();
          }
        }
      }
    }
    return Promise.resolve();
  }

  /**
   * Test if all transports are ready to receive messages.
   * @returns {boolean}
   * @private
   */
  _allTransportsReady() {
    let result = true;
    for (let idx = 0; idx < this.transports.length; idx++) {
      let transport = this.transports[idx];
      if (!transport.ready()) {
        result = false;
      }
    }
    return result;
  }

  /**
   * Set automatically when the epdoc-logger module is initialized, but can be set manually to
   * the earliest known time that the application was started.
   * @param d {Date} The application start time
   * @return {LogManager}
   */
  setStartTime(d) {
    this.t0 = new Date(d).getTime();
    return this;
  }

  /**
   * Get the time at which the app or this module was initialized
   * @return {Number} Start time in milliseconds
   */
  getStartTime() {
    return this.t0;
  }

  /**
   * Return a new {@link Logger} object with the specified emitter name.
   * Although it's a new logger instance, it still uses the same underlying
   * 'writeMessageParams' method, and whatever transport is set globally by this LogManager.
   * @param {string} emitter Name of emitter, module or file, added as a column to log output
   * @param {object} [context] A context object. For Express or koa this would have 'req' and
   *   'res' properties. The context.req may also have reqId and sid/sessionId/session.id
   *   properties that are used to populate their respective columns of output. Otherwise these
   *   columns are left blank on output.
   * @return A new {logger} object.
   */
  getLogger(emitter, context) {
    return new Logger(this, emitter, context);
  }

  /**
   * @deprecated
   */
  // get: function (moduleName, context) {
  //     return this.getLogger(moduleName, context);
  // },

  /**
   * A wrapper for logParams with a more limited set of properties.
   * @param {string} level
   * @param {string} action
   * @param {string} message
   * @param {Object} [data]
   * @return {LogManager}
   * @see {LogManager#logParams}
   */
  logMessage(options: LogMessage = {}) {
    const opts = Object.assign({ emitter: 'logger', action: 'log' }, options);
    return this.logParams(opts);
  }

  /**
   * Write a raw message to the transport. The LogManager will buffer messages to handle the
   * situation where we are switching transports and the new transport is not yet ready. It is
   * possible to log directly to a transport using this method and never need to create a {@link
   * Logger} object.
   *
   */
  logParams(options: LogMessage) {
    if (options) {
      options.level = options.level ?? this._logLevels.asValue('info');
      options.time = options.time ?? new Date();
      options.timeDiff = options.timeDiff ?? options.time.getTime() - this.t0;
      this.queue.push(options);
      this._logLevels.incCounter(options.level);
    }
    return this.flushQueue();
  }

  /**
   * Set the {@link LogManager} objects's minimum log level.
   * @param level {string} - Must be one of {@link LogManager#LEVEL_ORDER}
   * @param [options] {Object}
   * @param [options.transports=false] {Boolean} Set the level for all transports as well.
   * @return {LogManager}
   */
  setLevel(level, options) {
    this.levelThreshold = level;
    if (this.transports) {
      for (let tdx = 0; tdx < this.transports.length; tdx++) {
        let transport = this.transports[tdx];
        transport.setLevel(level);
      }
    }
    return this;
  }

  /**
   * Return true if the level is equal to or greater then the {@link LogManager#levelThreshold}
   * property.
   * @param level {string} Level that is to be tested
   * @param [thresholdLevel] {string} Threshold level against which <code>level</code> is to be
   *   tested. If this is not supplied then the level will be tested against {@link
   *   LogManager#logLevel}.
   * @return {boolean}
   */
  isAboveLevel(level: LogLevelValue, threshold: LogLevelValue): boolean {
    return LogLevel.meetsLogThreshold(level, threshold);
  }

  /**
   * Write a log line to the transport with a count of how many of each level of message has been
   * output. This is a useful function to call when the application is shutdown.
   * @param {string} [message]
   * @return {LogManager}
   */
  writeCount(message: string) {
    return this.logParams({
      emitter: 'logger',
      action: 'counts',
      data: this._logLevels.counter,
      message: message
    });
  }

  /**
   * Set whether to show an error stack as data when an Error is encountered.
   * This option can also be set in the {@link LogManager} constructor. The property is
   * referenced by {@link Logger} objects when they are created, and is used by the {@link
   * Logger} to determine whether to output an error stack trace in the data column when an
   * Error is logged.
   * @param {boolean} [bShow=true] Set whether to log the call stack for logged errors.
   * @returns {LogManager}
   */
  errorStack(bShow) {
    this.errorStackThreshold = bShow === false ? false : true;
    return this;
  }

  /**
   * Stops and removes all transports. Should be called before a shutdown.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  destroying(): Promise<any> {
    return this.stopping().then(() => {
      this.transports = [];
      return Promise.resolve();
    });
  }

  /**
   * Flushes all transport queues, disconnects all logging transports, but leaves the list of
   * transports intact. Call the start method to restart logging and reconnect all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  stopping(): Promise<any> {
    this.running = false;
    let jobs = [];
    this.transports.forEach((transport) => {
      let job = transport.stop();
      jobs.push(job);
    });
    return Promise.all(jobs);
  }

  /**
   * Flush the buffers for all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  flushing(): Promise<any> {
    let jobs = [];
    this.transports.forEach((transport) => {
      let job = transport.flush();
      jobs.push(job);
    });
    return Promise.all(jobs);
  }
}
