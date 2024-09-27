import { isArray } from '@epdoc/typeutil';
import { LogLevel, LogLevelValue } from './level';
import { LogManager } from './log-manager';
import { Logger } from './logger';
import { LogTransport, LogTransportOpenCallbacks, LogTransportType } from './transports/base';
import { TransportFactory } from './transports/factory';
import {
  consoleTransportDefaults,
  isTransportOptions,
  LogMessage,
  TransportOptions
} from './types';

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

export class TransportManager {
  protected _logMgr: LogManager;
  protected _transportFactory: TransportFactory = new TransportFactory();
  protected _transports: LogTransport[] = [];
  protected _areAllTransportsReady: boolean = false;

  constructor(logMgr: LogManager) {
    this._logMgr = logMgr;
  }

  public hasTransports(): boolean {
    return this._transports.length > 0;
  }

  public get allReady(): boolean {
    return this._areAllTransportsReady;
  }

  protected get logMgr(): LogManager {
    return this._logMgr;
  }

  protected get logLevels(): LogLevel {
    return this._logMgr.logLevels;
  }

  /**
   * Set the log level for all transports. Called from `LogManager.level()` method.
   * @param level {string} The log level to set.
   */
  setLevelThreshold(level: LogLevelValue): this {
    this._transports.forEach((transport) => {
      transport.levelThreshold = level;
    });
    return this;
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
   * Add a log transport. Multiple transports can be in operation at the same time, allowing log
   * messages to be sent to more than one destination.
   * If you are adding a transport while logging is on, you should first call logMgr.stopping,
   * add the transport, then call logMgr.start.
   *
   */
  addTransport(options: TransportOptions): this {
    let newTransport = this._transportFactory.getTransport(options);
    if (newTransport) {
      this._transports.unshift(newTransport);
      let name = newTransport.name;
      let topts = newTransport.getOptions();
      let sOptions = topts ? ' (' + JSON.stringify(topts) + ')' : '';
      this._logMgr.logMessage({
        action: 'logger.transport.add',
        message: "Added transport '" + name + "'" + sOptions,
        data: { transport: newTransport.name }
      });
    }
    return this;
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
    let jobs = [];
    this._transports.forEach((transport) => {
      let job = this.startingTransport(transport);
      jobs.push(job);
    });
    return Promise.all(jobs);
  }

  private startingTransport(transport): Promise<any> {
    let self = this;
    return new Promise(function (resolve, reject) {
      let name = transport.name;
      let bResolved = false;

      const cb: LogTransportOpenCallbacks = {
        onSuccess: () => {
          transport.clear();
          this.allReadyCompute();
          this._logMgr.logMessage({
            level: this._logLevels.asValue('info'),
            action: 'logger.start.success',
            message: `Started transport '${name}'`,
            data: { transport: name }
          });
          if (!bResolved) {
            bResolved = true;
            resolve(true);
          }
        },
        onError: (err) => {
          this._logMgr.logMessage({
            level: this.logLevels.asValue('info'),
            action: 'logger.warn',
            message: `Tried but failed to start transport '${name}'. ${err}`,
            data: { transport: name }
          });
          this.removeTransport(transport);
          this.allReadyCompute();
          if (!bResolved) {
            bResolved = true;
            resolve(true);
          }
        },
        onClose: () => {
          this._logMgr.logMessage({
            level: this.logLevels.asValue('info'),
            action: 'logger.close',
            message: `Closed transport '${name}'`,
            data: { transport: name }
          });
          this.removeTransport(transport);
          this.allReadyCompute();
        }
      };

      transport.open(cb);
    });
  }

  // _getNewTransport(options: TransportOptions): LogTransport {
  //   if (isTransportOptions(options)) {
  //     const defaultOpts: LogMessageConsts = {
  //       sid: this._msgConsts.sid,
  //       static: this._msgConsts.static
  //     };
  //     const opts: TransportOptions = Object.assign(defaultOpts, options);
  //     const transport: LogTransport = this._transportFactory.getTransport(opts);
  //     if (transport) {
  //       const err = transport.validateOptions();
  //       if (!err) {
  //         return transport;
  //       } else {
  //         this.logLoggerMessage({
  //           action: 'logger.transport.add.warn',
  //           message: `Could not add transport ${opts.name}: ${err.message}`,
  //           data: { options: options }
  //         });
  //       }
  //     }
  //   }
  // }

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
  removeTransport(transport: LogTransportType | LogTransport): Promise<any> {
    let remainingTransports = [];
    let jobs = [];
    this._transports.forEach((t) => {
      if (t.match(transport)) {
        let job = t.stop();
        jobs.push(job);
        this._logMgr.logMessage({
          action: 'logger.transport.remove',
          message: `Removed transport '${t.toString()}'`,
          data: { transport: t.toString() }
        });
      } else {
        remainingTransports.push(t);
      }
    });
    this._transports = remainingTransports;
    this.allReadyCompute();
    return Promise.all(jobs);
  }

  // /**
  //  * Test if this is a known transport
  //  * @param s {string} Name of the transport
  //  * @returns {boolean}
  //  */
  // isValidTransport(s) {
  //   if (isString(s) && ['console', 'file', 'callback', 'loggly', 'sos'].indexOf(s) >= 0) {
  //     return true;
  //   }
  //   return false;
  // }

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
  getTransports(): LogTransport[] {
    return this._transports;
  }

  writeMessage(msg: LogMessage): void {
    this._transports.forEach((transport) => {
      if (this.logLevels.meetsThreshold(msg.level, transport.levelThreshold)) {
        // nextMsg.level = undefined;
        transport.write(msg);
      }
    });
  }

  /**
   * Test if there is at least one transport, and all transports are ready to receive messages.
   * @returns {boolean}
   * @private
   */
  allReadyCompute(): this {
    this._areAllTransportsReady = this.hasTransports() && this._transports.every((t) => t.ready());
    return this;
  }

  /**
   * Flushes all transport queues, disconnects all logging transports, but leaves the list of
   * transports intact. Call the start method to restart logging and reconnect all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  stop(): Promise<any> {
    let jobs = [];
    this._transports.forEach((transport) => {
      let job = transport.stop();
      jobs.push(job);
    });
    this.allReadyCompute();
    return Promise.all(jobs);
  }

  /**
   * Flush the buffers for all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  flush(): Promise<any> {
    let jobs = [];
    this._transports.forEach((transport) => {
      let job = transport.flush();
      jobs.push(job);
    });
    return Promise.all(jobs);
  }

  destroy(): void {
    this._transports = [];
  }
}
