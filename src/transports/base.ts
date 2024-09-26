import { dateUtil, durationUtil } from '@epdoc/timeutil';
import { Integer, isDate, isFunction, isString, isValidDate } from '@epdoc/typeutil';
import { LogLevel, LogLevelValue } from '../level';
import { AppTimer } from '../lib/app-timer';
import { LoggerShowOpts, LogMessage, LogMsgPart, TimePrefix } from '../types';
import { TransportStringFormatter } from './formatters/string';

let transportIdx: Integer = 0;

export type LogTransportType = 'console' | 'file' | 'callback' | 'loggly' | 'sos' | string;
export type LogTransportOpenCallbacks = {
  onSuccess: (val: boolean) => void;
  onError: (err: Error) => void;
  onClose: () => void;
};

export class LogTransport {
  protected _showOpts: LoggerShowOpts;
  protected _logLevels: LogLevel;
  protected _timer: AppTimer;
  protected _startTime: Date;
  id: Integer = transportIdx++;
  // bIncludeSid: boolean;
  // bIncludeStatic: boolean;
  // colorize: boolean;
  // timestampFormat: string;
  protected _levelThreshold: LogLevelValue;
  bReady: boolean;
  protected _msgParts: LogMsgPart[];

  constructor(opts: LoggerShowOpts, logLevels: LogLevel, timer: AppTimer) {
    this._showOpts = opts || {};
    this._logLevels = logLevels;
    this._timer = timer;
  }

  /**
   * Validate the options for the transport.
   * @param previous {LogTransport} Optional previous transport for comparison.
   * @returns {Error | undefined} An error if validation fails, otherwise undefined.
   */
  validateOptions(previous?: LogTransport): Error | undefined {
    return null;
  }

  /**
   * Get the name of the transport.
   * @returns {string} The name of the transport.
   */
  get name(): string {
    return `transport.${this.type}.${this.id}`;
  }

  /**
   * Get the type of the transport.
   * @returns {string} The type of the transport.
   */
  get type(): string {
    return 'invalid';
  }

  /**
   * Check if the transport is writable. Even though a transport exists, and has
   * been opened, it may not be ready to be writable.
   * @returns {boolean} True if the transport is writable, otherwise false.
   */
  get writable(): boolean {
    return false;
  }

  /**
   * Set the log level for the transport.
   * @param level {string} The log level to set.
   */
  set levelThreshold(level: LogLevelValue) {
    this._levelThreshold = level;
  }

  get levelThreshold(): LogLevelValue {
    return this._levelThreshold;
  }

  /**
   * Test if the transport matches the argument.
   * @param transport {string|object} If a string then matches if equal to 'console'. If an object
   *   then matches if transport.type equals 'console'.
   * @returns {boolean} True if the transport matches the argument
   */
  match(transport: LogTransportType | LogTransport) {
    if (isString(transport) && transport === this.type) {
      return true;
    }
    if (transport instanceof LogTransport && transport.type === this.type) {
      return true;
    }
    return false;
  }

  /**
   * Return true if this logger is ready to accept write operations.
   * Otherwise the caller should buffer writes and call write when ready is true.
   * @returns {boolean} True if ready, otherwise false.
   */
  public ready() {
    return this.bReady;
  }

  /**
   * Open the transport for writing.
   * @param cb {LogTransportOpenCallbacks} Callback functions for success, error, and close events.
   */
  open(cb: LogTransportOpenCallbacks): void {
    this.bReady = true;
    cb.onError(new Error('Base transport cannot be opened'));
  }

  /**
   * Used to clear the logger display. This is applicable only to certain transports, such
   * as socket transports that direct logs to a UI.
   */
  public clear() {}

  /**
   * Flush any buffered log messages.
   * @returns {Promise<void>} A promise that resolves when the flush is complete.
   */
  public flush(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Write a log message.
   * @param msg {LogMessage} The log message to write.
   * @returns {this} The current instance for chaining.
   */
  public write(msg: LogMessage): this {
    let str = this.formatLogMessage(msg);
    return this._write(str);
  }

  /**
   * Internal method to perform the actual write operation.
   * @param msg {string} The message to write.
   * @returns {this} The current instance for chaining.
   */
  protected _write(msg: string): this {
    throw new Error('Base transport cannot be written to');
    return this;
  }

  /**
   * Stop the logging process.
   * @returns {Promise<void>} A promise that resolves when the logging is stopped.
   */
  public stop(): Promise<void> {
    return this.end();
  }

  /**
   * End the logging process.
   * @returns {Promise<void>} A promise that resolves when the logging is ended.
   */
  public end(): Promise<void> {
    this.bReady = false;
    return Promise.resolve();
  }

  public toString() {
    return 'Console';
  }

  public getOptions() {
    return undefined;
  }

  formatTimestamp(msg: LogMessage, format: TimePrefix) {
    if (format === 'elapsed') {
      if (msg.timeDiff) {
        return durationUtil(msg.timeDiff).toString();
      } else if (isDate(msg.time)) {
        return durationUtil(msg.time.getTime() - this._startTime.getTime()).toString();
      }
    } else if (isValidDate(msg.time)) {
      if (format === 'utc') {
        return msg.time.toISOString();
      } else if (format === 'local') {
        return dateUtil(msg.time).toLocaleString();
      }
    }
    return '0';
  }

  /**
   * Format the log message based on the provided parameters.
   * @param params {LogMessage} The log message parameters.
   * @returns {string} The formatted log message.
   */
  protected formatLogMessage(params: LogMessage): string {
    const formatter = new TransportStringFormatter(
      params,
      this._showOpts,
      this._formatOpts,
      this._logLevels
    );
    return formatter.format();

    // const line = this._msgParts.join(' ');
    // this._state.transport.write(this);
    this.clear();
    if (isFunction(this.options.format)) {
      return this.options.format(params, opts);
    } else if (this.options.format === 'template') {
      return format.paramsToString(params, opts);
    } else if (this.options.format === 'json') {
      let json = format.paramsToJson(params, opts);
      return JSON.stringify(json);
    } else {
      let json = format.paramsToJsonArray(params, opts);
      return JSON.stringify(json);
    }
  }
}
