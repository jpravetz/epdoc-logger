import { Integer, isString } from '@epdoc/typeutil';
import { LogMgr } from '../core/logmgr';
import { Style } from '../core/style';
import { AppTimer } from '../lib/app-timer';
import { LogLevels, LogLevelValue } from '../log-levels';
import {
  LoggerShowOpts,
  LogMessage,
  LogMsgPart,
  MsgBuilderFormatOpts,
  SeparatorOpts,
  TimePrefix,
  TransportOptions
} from '../types';
import { TransportFormatterFactory } from './formatters/factory';

let transportIdx: Integer = 0;

export type LogTransportType = 'console' | 'file' | 'callback' | 'loggly' | 'sos' | string;
export type LogTransportOpenCallbacks = {
  onSuccess: (val: boolean) => void;
  onError: (err: Error) => void;
  onClose: () => void;
};

export class LogTransport {
  protected _logMgr: LogMgr;
  protected _formatterFactory: TransportFormatterFactory;
  protected _showOpts: LoggerShowOpts;
  protected _style: Style;
  protected _separatorOpts: SeparatorOpts;
  // protected _logLevels: LogLevel;
  protected _formatOpts: MsgBuilderFormatOpts;
  // protected _timer: AppTimer;
  id: Integer = transportIdx++;
  // bIncludeSid: boolean;
  // bIncludeStatic: boolean;
  // colorize: boolean;
  // timestampFormat: string;
  protected _levelThreshold: LogLevelValue;
  protected _errorStackThreshold: LogLevelValue;
  bReady: boolean;
  protected _msgParts: LogMsgPart[];

  constructor(logMgr: LogMgr, opts: TransportOptions) {
    this._logMgr = logMgr;
    this._showOpts = opts.show;
    this._separatorOpts = opts.separator;
    this._formatOpts = opts.format;
    this._levelThreshold = logMgr.levelAsValue(opts.levelThreshold);
    this._errorStackThreshold = logMgr.levelAsValue(opts.errorStackThreshold);

    // this._logLevels = opts.logLevel;
    // this._timer = opts.timer;
    // const missing: string[] = [];
    // if (!opts.logLevel) {
    //   missing.push('logLevel');
    // }
    // // if (!opts.timer) {
    // //   missing.push('timer');
    // // }
    // if (missing.length > 0) {
    //   throw new Error(`LogTransport missing required options: ${missing.join(', ')}`);
    // }
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
  get uid(): string {
    return `transport.${this.type}.${this.id}`;
  }

  /**
   * Get the type of the transport.
   * @returns {string} The type of the transport.
   */
  get type(): string {
    return 'invalid';
  }

  get logLevels(): LogLevels {
    return this._logMgr.logLevels;
  }

  get timer(): AppTimer {
    return this._logMgr.appTimer;
  }

  get logMgr(): LogMgr {
    return this._logMgr;
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
    if (this._formatOpts.type === 'string') {
      return this.writeString(this.formatLogMessage(msg) as string);
    }
    throw new Error('Base transport write method does not support writing formatted messages');
  }

  /**
   * Internal method to perform the actual write operation.
   * @param msg {string} The message to write.
   * @returns {this} The current instance for chaining.
   */
  protected writeString(msg: string): this {
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
    return this.uid;
  }

  public getOptions() {
    return undefined;
  }

  formatTimestamp(msg: LogMessage, format: TimePrefix) {
    return this.timer.getTimeForPrefix(format);
  }

  /**
   * Format the log message based on the provided parameters.
   * @param params {LogMessage} The log message parameters.
   * @returns {string} The formatted log message.
   */
  protected formatLogMessage(params: LogMessage): any {
    const formatterType = this._formatOpts.type ?? 'string';
    const formatter = this._formatterFactory.getFormatter(formatterType);
    formatter.init({
      logMgr: this._logMgr,
      show: this._showOpts,
      format: this._formatOpts
    });
    return formatter.format(params);
  }
}
