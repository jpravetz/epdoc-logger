import {
  type Dict,
  isDefined,
  isDict,
  isNonEmptyArray,
  isNonEmptyString,
  isPosInteger,
  isString,
} from '@epdoc/typeutil';
// import fetch from 'node-fetch';
import os from 'node:os';
import type { LogMgr } from '../core/mod.ts';
import type { LogMessage, TransportOptions } from '../src/types.ts';
import type { LogTransport, LogTransportOpenCallbacks } from '../core/transports/base.ts';

export const defaultLogglyTransportOpts: TransportOptions = {
  type: 'loggly',
  format: {
    type: 'json',
  },
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: true,
    sid: true,
    static: true,
    emitter: true,
    action: true,
    data: true,
  },
  separator: {
    char: '#',
    length: 80,
  },
  levelThreshold: 'info',
  errorStackThreshold: 'error',
  options: {},
};

export type LogglyTransportOptions = {
  token: string;
  tags?: string | string[];
  bufferSize?: number;
  maxBufferSize?: number;
  flushInterval?: number;
  host?: string;
  url?: string;
};

export class LogglyTransport extends LogTransport {
  protected _token: string;
  protected _subdomain = 'logs-01';
  protected _aTags = ['epdoc'];
  protected _tags: string;
  protected _bufferSize = 100;
  protected _maxBufferSize = 1024;
  protected _flushInterval = 5000;
  protected _buffer: string[] = [];
  protected _url: string;
  protected _host: string = os.hostname();
  protected _cb: LogTransportOpenCallbacks;
  protected _timer: number;

  constructor(logMgr: LogMgr, options: TransportOptions) {
    super(logMgr, options);
    if (!isDict(options.options)) {
      throw new Error('Loggly options are required');
    }
    const opts = options.options as LogglyTransportOptions;
    if (isDefined(opts.token)) {
      this._token = opts.token;
    }
    if (isNonEmptyArray(opts.tags)) {
      this._aTags = this._aTags.concat(opts.tags);
    } else if (isString(opts.tags)) {
      this._aTags.push(opts.tags);
    }
    this._tags = `/tag/${this._aTags.join(',')}/`;
    if (opts.url) {
      this._url = opts.url;
    } else {
      this._url = `https://${this._subdomain}.loggly.com/bulk/${this._token}${this._tags}`;
    }
    if (isPosInteger(opts.bufferSize)) {
      this._bufferSize = opts.bufferSize;
    }
    if (isPosInteger(opts.maxBufferSize)) {
      this._maxBufferSize = opts.maxBufferSize;
    }
    if (isPosInteger(opts.flushInterval)) {
      this._flushInterval = opts.flushInterval;
    }
    if (isNonEmptyString(opts.host)) {
      this._host = opts.host;
    }
    this._buffer = [];
  }

  validateOptions() {
    if (!isString(this._token)) {
      return new Error('Token not specified or invalid');
    }
    return null;
  }

  open(cb: LogTransportOpenCallbacks): void {
    this._cb = cb;
    this._timer = setInterval(() => {
      if (this._buffer.length) {
        this.flush();
      }
    }, this._flushInterval);
    this.bReady = true;
    cb.onSuccess(true);
  }

  get type() {
    return 'loggly';
  }

  /**
   * Used to clear the logger display. This is applicable only to certain transports, such
   * as socket transports that direct logs to a UI.
   */
  clear() {}

  public write(msg: LogMessage): this {
    const json = this.formatLogMessage(msg) as Dict;
    if (this._host) {
      json.hostname = this._host;
    }
    if (this._buffer.length < this._maxBufferSize) {
      this._buffer.push(JSON.stringify(json));
    } else if (this._buffer.length === this._maxBufferSize) {
      const params: LogMessage = {
        level: this.logMgr.levelAsValue('warn'),
        emitter: 'logger.transport.loggly',
        action: 'buffer.limit.exceeded.dropping.messages',
        message: 'Loggly buffer limit exceeded. Dropping messages.',
      };
      this._buffer.push(JSON.stringify(params));
    } else {
      // drop the message on the floor
    }
    if (this._buffer.length >= this._bufferSize) {
      this.flush();
    }
    return this;
  }

  flush(): Promise<void> {
    const msgs: string[] = this._buffer;
    this._buffer = [];
    return this._send(msgs).catch((err) => {
      const params: LogMessage = {
        level: this.logMgr.levelAsValue('warn'),
        emitter: 'logger.transport.loggly',
        action: 'send.warning.will.retry',
        message: 'Error sending message to loggly . ' + err,
      };
      this.logMgr.logMessage(params);
    });
  }

  _send(msgs: string[]): Promise<void> {
    const body = msgs.join('\n');
    return fetch(this._url, { method: 'POST', body: body }).then((res) => {
      if (res.status >= 400) {
        throw new Error(res.status + ' response');
      }
    });
  }

  /**
   * Flushes the queue and closes the connections to loggly.
   * @param cb
   */
  public end(): Promise<void> {
    return this.flush().then(() => {
      clearInterval(this._timer);
      this.bReady = false;
      this._cb.onClose();
    });
  }

  getOptions() {
    return { tags: this._aTags };
  }

  // _formatLogMessage (msg: LogMessage) {
  //   let json = {
  //     timestamp: msg.time ? msg.time.toISOString() : new Date().toISOString(),
  //     level: msg.level,
  //     emitter: msg.emitter,
  //     action: msg.action,
  //     data: msg.data
  //   };
  //   if (msg.message) {
  //     if (typeof msg.message === 'string' && msg.message.length) {
  //       json.message = msg.message;
  //     } else if (msg.message instanceof Array) {
  //       json.message = msg.message.join('\n');
  //     }
  //   }
  //   if (this.bIncludeSid) {
  //     json.sid = msg.sid;
  //     json.reqId = msg.reqId;
  //   }
  //   if (this.bIncludeStatic) {
  //     json.static = msg.static;
  //   }
  //   return json;
  // }

  // pad (n, width, z) {
  //   z = z || '0';
  //   n = n + '';
  //   return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  // }
}
