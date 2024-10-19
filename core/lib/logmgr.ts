import type { LogLevel, LogLevelName, LogLevels } from '../../levels/levels.ts.txt';
import { Logger } from './logger.ts';
import type { Style } from './style.ts';
import { TransportManager } from './transport-mgr.ts';
import type { LogMessage, LogMessageConsts, LogMgrDefaults, TransportOptions } from './types.ts';

let mgrIdx = 0;

/**
 * Create a new LogManager object with no transports. Logged messages will not begin
 * writing to the transport until a transport is added and [start()]{@link LogMgr#start} is
 * called. Pass in configuration options to configure the logger and transports.
 *
 * <p>To manually add a transport call [addTransport()]{@link LogMgr#addTransport}. More than
 * one transport can be configured at the same time. Alternatively the LogManager can be started up
 * immediately by setting <code>options.autoRun</code> to true. In this situation, if
 * <code>options.transports</code> is set, then the specified transports will be used. But if
 * <code>options.transports</code> is not set, then the default {@link ConsoleTransport} is used.
 *
 * <p>It is normal to have one LogManager per application, and to call
 * [get(emitterName)]{@link LogMgr#getLogger} to get a new {@link Logger} object for each
 * emitter and then call methods on this {@link Logger} object to log messages.
 *
 * <p>Refer to {@link LogMgr#setOptions} for options documentation.
 *
 * @class A LogManager is used to manage logging, including transports, startup, shutdown and
 *   various options.
 * @constructor
 */

export class LogMgr {
  protected uid: string;
  protected _style: Style;
  // protected _show: LoggerShowOpts;
  protected _requireAllTransportsReady = false;
  // protected _separatorOpts: SeparatorOpts;
  protected _msgConsts: LogMessageConsts;
  protected _defaults: LogMgrDefaults;
  protected _logLevels: LogLevels;
  protected _transportMgr: TransportManager = new TransportManager(this);
  protected consoleOptions: unknown;
  protected _running: boolean = false;

  protected _msgQueue: LogMessage[] = [];
  protected levelThreshold: LogLevel;
  protected errorStackThreshold: LogLevel;

  constructor() {
    this.uid = 'LogManager#' + mgrIdx++;
  }

  get logLevels(): LogLevels {
    return this._logLevels;
  }

  setStyle(style: Style): this {
    this._style = style;
    return this;
  }

  get style(): Style {
    return this._style;
  }

  public addTransport(opts: TransportOptions): this {
    this._transportMgr.addTransport(opts);
    return this;
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
  protected getLogger(emitter: string): Logger {
    const msgConsts: LogMessageConsts = Object.assign({}, this._msgConsts, { emitter });
    return new Logger(this);
    // return new Logger(this, msgConsts, this._context);
  }

  /**
   * Starts all transports, if not already started. This enables logs to be written to the
   * transports. It is necessary to manually start the transports if not using the default
   * transport, to allow time for the transports to be setup. Log messages will be buffered until
   * all transports are ready. If there are no transports configured then this method will
   * add the console transport to ensure that there is at least one transport.
   * @param {function} [callback] Called when all transports are ready to receive messages. It is
   *   not normally necessary to wait for this callback.
   * @return {LogMgr}
   */
  public async start(): Promise<unknown> {
    if (!this._running) {
      return this._transportMgr
        .start()
        .then(() => {
          this._running = true;
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
   * Calling this function will conditionally cause the queue to be flushed.
   * Messages are first written to a buffer using the `logMessage` function, then
   * flushed. Normally this function should not need to be called externally, as
   * it is called internally whenever there may be messages to write. When
   * `_requireAllTransportsReady` is true, will only flush the queue if all
   * transports are ready to receive messages.
   * @returns {LogMgr}
   */
  protected flushQueue(): this {
    if (this._running && this._msgQueue.length) {
      if (
        this._transportMgr.hasTransports() &&
        (!this._requireAllTransportsReady || this._transportMgr.allReady)
      ) {
        const nextMsg = this._msgQueue.shift();
        if (nextMsg) {
          this._transportMgr.writeMessage(nextMsg);
          this.flushQueue();
        }
      }
    }
    return this;
  }

  /**
   * The log manager writes it's own log message to the transport(s) using this
   * method. The emitter is set to 'logger' and the action is set to 'log'.
   * @param options {LogMessage} - The log message options.
   * @returns {void}
   */
  protected logLoggerMessage(options: LogMessage = {}): this {
    const opts = Object.assign({ emitter: 'logger', action: 'log' }, options);
    return this.logMessage(opts);
  }

  /**
   * Write a raw message to the transport by first putting it on the queue, and
   * then flusing the queue. The LogManager will buffer messages to handle the
   * situation where we are switching transports and the new transport is not
   * yet ready. It is possible to log directly to a transport using this method
   * and never need to create a {@link Logger} object. But the intent of this
   * method is for internal use by the logger code to log it's own activity.
   * @param options {LogMessage} - The log message options.
   * @returns {void}
   */
  logMessage(options: LogMessage): this {
    if (!this._logLevels) {
      throw new Error('LogLevels not defined for this LogMgr');
    }
    // if (!options.timer) {
    //   options.timer = new AppTimer();
    // }
    options.level = options.level ?? this._logLevels.asValue('info');
    this._msgQueue.push(options);
    this._logLevels.incCounter(options.level);
    return this.flushQueue();
  }

  levelAsValue(val: LogLevel | LogLevelName | string): LogLevel {
    return this._logLevels.asValue(val);
  }

  level(level: LogLevelName | LogLevel): this {
    this._logLevels.levelThreshold = level;
    this._transportMgr.setLevelThreshold(this._logLevels.levelThreshold);
    return this;
  }

  /**
   * Set the {@link LogMgr} objects's minimum log level for showing error
   * stacks. This applies to all transports as well: they cannot have unique
   * error stack levels.
   * @param level {string} - Must be one of {@link LogMgr#LEVEL_ORDER}
   * @param [options] {Object}
   * @param [options.transports=false] {Boolean} Set the level for all
   * transports as well.
   * @return {LogMgr}
   */
  errorLevel(level: LogLevelName | LogLevel): this {
    this._logLevels.errorStackThreshold = level;
    return this;
  }

  /**
   * Return true if the level is equal to or greater then the {@link LogMgr#levelThreshold}
   * property.
   * @param level {string} Level that is to be tested
   * @param [thresholdLevel] {string} Threshold level against which <code>level</code> is to be
   *   tested. If this is not supplied then the level will be tested against {@link
   *   LogManager#logLevel}.
   * @return {boolean}
   */
  // isAboveLevel(level: LogLevelValue, threshold: LogLevelValue): boolean {
  //   return LogLevel.meetsLogThreshold(level, threshold);
  // }

  /**
   * Write a log line to the transport with a count of how many of each level of message has been
   * output. This is a useful function to call when the application is shutdown.
   * @param {string} [message]
   * @return {LogMgr}
   */
  writeCount(message: string) {
    return this.logLoggerMessage({
      emitter: 'logger',
      action: 'counts',
      data: this._logLevels.counter,
      message: message,
    });
  }

  /**
   * Stops and removes all transports. Should be called before a shutdown.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  destroying(): Promise<unknown> {
    return this.stopping().then(() => {
      this._transportMgr.destroy();
      return Promise.resolve();
    });
  }

  /**
   * Flushes all transport queues, disconnects all logging transports, but leaves the list of
   * transports intact. Call the start method to restart logging and reconnect all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  stopping(): Promise<unknown> {
    this._running = false;
    return this._transportMgr.stop();
  }

  /**
   * Flush the buffers for all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  flushing(): Promise<unknown> {
    return this._transportMgr.flush();
  }
}
