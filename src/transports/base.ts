import { Integer, isString } from '@epdoc/typeutil';
import { LogMessage } from '../types';

let transportIdx: Integer = 0;

export type TransportFunctions = {
  onSuccess: (val: boolean) => void;
  onError: (err: Error) => void;
  onClose: () => void;
};

/*****************************************************************************
 * Create a new Console transport to output log messages to the console.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {Boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param [options.colorize=true] {Boolean} - Set to true to enable colorize formatted output.
 * @param [options.template] {String} - Provide a template string to use for output when
 *   options.format is 'string', substitutes ${ts} %{level} ${emitter} type strings, where '%'
 *   indicates string should be colorized.
 * @param [options.timestamp=ms] {String} - Set the format for timestamp output, must be one of
 *   'ms' or 'iso'.
 * @param [options.format=jsonArray] {String|function} - Set the format for the output line. Must
 *   be one of 'json', 'jsonArray', 'template', or a function that takes params and options as
 *   parameters.
 * @param [options.static=true] {Boolean} - Set whether to output a 'static' column.
 * @param [options.level] {String} - Log level above which to output log messages, overriding
 *   setting for LogManager.
 * @constructor
 */

export class LogTransport {
  options: any;
  id: Integer = transportIdx++;
  bIncludeSid: boolean;
  bIncludeStatic: boolean;
  colorize: boolean;
  timestampFormat: string;
  level: string;
  bReady: boolean;

  constructor(options) {
    this.options = options || {};
    this.bIncludeSid =
      this.options.sid === false || this.options.bIncludeSid === false ? false : true;
    this.bIncludeStatic = this.options.static === false ? false : true;
    this.colorize = this.options.colorize !== false;
    this.timestampFormat = this.options.timestamp || 'ms';
    this.level = this.options.level;
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
  public setLevel(level) {
    this.level = level;
  }

  /**
   * Test if the transport matches the argument.
   * @param transport {string|object} If a string then matches if equal to 'console'. If an object
   *   then matches if transport.type equals 'console'.
   * @returns {boolean} True if the transport matches the argument
   */
  match(transport: string | LogTransport) {
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
   * @param cb {TransportFunctions} Callback functions for success, error, and close events.
   */
  open(cb: TransportFunctions): void {
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
  protected write(msg: LogMessage): this {
    let str = this.formatLogMessage(msg);
    return this._write(str);
  }

  /**
   * Internal method to perform the actual write operation.
   * @param msg {string} The message to write.
   * @returns {this} The current instance for chaining.
   */
  protected _write(msg: string): this {
    console.log(msg);
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

  /**
   * Format the log message based on the provided parameters.
   * @param params {LogMessage} The log message parameters.
   * @returns {string} The formatted log message.
   */
  protected formatLogMessage(params: LogMessage) {
    let opts = {
      timestamp: this.timestampFormat,
      sid: this.bIncludeSid,
      static: this.bIncludeStatic,
      colorize: this.colorize,
      template: this.options.template
    };
    if (_.isFunction(this.options.format)) {
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
