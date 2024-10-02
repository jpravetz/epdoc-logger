import { LogMgr } from './core';
import { LogLevels, LogLevelValue } from './log-levels';
import { LogTransport, LogTransportOpenCallbacks, LogTransportType } from './transports/base';
import { defaultConsoleTransportOpts } from './transports/console';
import { TransportFactory } from './transports/factory';
import { LogMessage, TransportOptions } from './types';

let mgrIdx = 0;

/**
 * Manages log transports, allowing for the addition, removal, and control of
 * multiple logging destinations.
 */
export class TransportManager {
  protected _logMgr: LogMgr;
  protected _transportFactory: TransportFactory = new TransportFactory();
  protected _transports: LogTransport[] = [];
  protected _areAllTransportsReady: boolean = false;

  /**
   * Creates an instance of TransportManager.
   * @param {LogMgr} logMgr - The log manager instance that manages all logging..
   */
  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }

  /**
   * Checks if there are any transports added.
   * @returns {boolean} True if there are transports, otherwise false.
   */
  public hasTransports(): boolean {
    return this._transports.length > 0;
  }

  /**
   * Gets the readiness status of all transports.
   * @returns {boolean} True if all transports are ready, otherwise false.
   */
  public get allReady(): boolean {
    return this._areAllTransportsReady;
  }

  protected get logMgr(): LogMgr {
    return this._logMgr;
  }

  protected get logLevels(): LogLevels {
    return this._logMgr.logLevels;
  }

  /**
   * Sets the log level for all transports.
   * @param {LogLevelValue} level - The log level to set.
   * @returns {this} The instance of TransportManager for chaining.
   */
  public setLevelThreshold(level: LogLevelValue): this {
    this._transports.forEach((transport) => {
      transport.levelThreshold = level;
    });
    return this;
  }

  /**
   * Add a log transport. Multiple transports can be in operation at the same time, allowing log
   * messages to be sent to more than one destination.
   * If you are adding a transport while logging is on, you should first call logMgr.stopping,
   * add the transport, then call logMgr.start.
   *
   */
  public addTransport(options: TransportOptions): this {
    let newTransport = this._transportFactory.getTransport(options);
    if (newTransport) {
      this._transports.unshift(newTransport);

      // log message that we've added a transport
      let name = newTransport.uid;
      let topts = newTransport.getOptions();
      let sOptions = topts ? ' (' + JSON.stringify(topts) + ')' : '';
      this._logMgr.logMessage({
        action: 'logger.transport.add',
        message: "Added transport '" + name + "'" + sOptions,
        data: { transport: newTransport.uid }
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
   * @returns {Promise<any>} A promise that resolves when all transports are started.
   */
  public async start(): Promise<any> {
    let jobs = [];
    if (!this.hasTransports()) {
      this.addTransport(defaultConsoleTransportOpts);
    }
    this._transports.forEach((transport) => {
      let job = this.startingTransport(transport);
      jobs.push(job);
    });
    return Promise.all(jobs);
  }

  /**
   * Starts a specific transport.
   * @param {LogTransport} transport - The transport to start.
   * @returns {Promise<any>} A promise that resolves when the transport is started.
   */
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

  /**
   * Remove a specific transport. Pauses log output. The caller should call [start()]{@link
   * LogMgr#start} to restart logging.
   * @param {LogTransportType | LogTransport} transport - The transport to remove.
   * @returns {Promise<any>} A promise that resolves when the transport is removed.
   */
  public removeTransport(transport: LogTransportType | LogTransport): Promise<any> {
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

  /**
   * Get the list of currently set transports.
   * @returns {LogTransport[]} The current array of transports.
   */
  getTransports(): LogTransport[] {
    return this._transports;
  }

  /**
   * Writes a log message to all applicable transports. This will write to all transports that
   * are ready and meet the threshold.
   * @param {LogMessage} msg - The log message to write.
   */
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
  private allReadyCompute(): this {
    this._areAllTransportsReady = this.hasTransports() && this._transports.every((t) => t.ready());
    return this;
  }

  /**
   * Flushes all transport queues, disconnects all logging transports, but leaves the list of
   * transports intact. Call the start method to restart logging and reconnect all transports.
   * @returns {Promise<any>} A promise that resolves when all transports are stopped.
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
   * @returns {Promise<any>} A promise that resolves when all buffers are flushed.
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
