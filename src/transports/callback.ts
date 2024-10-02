import { isFunction } from '@epdoc/typeutil';
import { LogMgr } from '../core';
import { TransportOptions } from '../types';
import { LogTransport, LogTransportOpenCallbacks } from './base';

export const defaultCallbackTransportOpts: TransportOptions = {
  type: 'callback',
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: false,
    action: false,
    data: false
  },
  format: {
    type: 'json',
    tabSize: 2,
    colorize: false
  }
};

export type CallbackTransportOptions = TransportOptions & {
  callback: Function;
  uid: Function;
};

/**
 * Create a new Callback transport where output is added to a data array or a callback is used to
 * pass thru the log message. Used for testing.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param [options.level] {string} - Log level above which to output log messages, overriding
 *   setting for LogManager.
 * @param {function} [options.callback] - Callback with object to be logged rather than adding to
 *   line buffer
 * @param {function} [options.uid] - Unique identifier used by {@link CallbackTransport#match}.
 * @constructor
 */
export class CallbackTransport extends LogTransport {
  protected _bIncludeSid: boolean;
  protected _bIncludeStatic: boolean;
  protected _level: string;
  protected _sType: string;
  protected _bReady: boolean;
  protected _logCallback: Function;
  protected _data: any[];

  constructor(logMgr: LogMgr, options: CallbackTransportOptions) {
    super(logMgr, options);
    this._showOpts = this._showOpts ?? defaultCallbackTransportOpts.show;
    this._logCallback = options.callback;
  }

  validateOptions() {
    return null;
  }

  open(cb: LogTransportOpenCallbacks) {
    this.bReady = isFunction(this._logCallback);
    cb.onSuccess(true);
  }

  get type(): string {
    return 'callback';
  }

  /**
   * Return true if this logger is ready to accept write operations.
   * Otherwise the caller should buffer writes and call write when ready is true.
   * @returns {boolean}
   */
  ready() {
    return this.bReady;
  }
  /**
   * Used to clear the logger display. This is applicable only to certain transports, such
   * as socket transports that direct logs to a UI.
   */
  clear() {
    this._data = [];
  }

  public flush(): Promise<void> {
    return Promise.resolve();
  }

  protected writeString(msg: string): this {
    if (isFunction(this._logCallback)) {
      this._logCallback(msg);
    } else {
      this._data.push(msg);
    }
    return this;
  }

  getOptions() {
    return undefined;
  }
}
