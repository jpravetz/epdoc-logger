import { isFunction, isString } from '@epdoc/typeutil';
import fs from 'node:fs';
import path from 'node:path';
import { LogMessage, TransportOptions } from '../types';
import { LogTransport, LogTransportOpenCallbacks } from './base';

export type FileTransportOptions = TransportOptions & {
  path: string;
};

export class FileTransport extends LogTransport {
  protected _path: string;
  protected _stream: fs.WriteStream;
  protected _writable = false;
  protected _buffer = []; // Used in case of stream backups
  protected _drainRegistered = false;
  constructor(options: FileTransportOptions) {
    super(options);
    this._path = options.path;
  }

  get writable(): boolean {
    return this._writable;
  }

  get type(): string {
    return 'file';
  }

  validateOptions(previous?: LogTransport): Error | undefined {
    if (!isString(this._path)) {
      return new Error('File not specified');
    }
    if (previous && previous.type === 'sos') {
      return new Error("Cannot switch from 'sos' logger to 'file' logger");
    }
  }

  match(transport: string | LogTransport) {
    return transport instanceof FileTransport && transport._path == this._path;
  }

  open(cb: LogTransportOpenCallbacks): void {
    try {
      let folder = path.dirname(this._path);
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }
      this._stream = fs.createWriteStream(this._path, { flags: 'a' });
      this._stream.on('error', function (err) {
        cb.onError(err);
      });
      this._stream.on('close', function () {
        this.bReady = false;
        cb.onClose();
      });
      this.bReady = true;
      cb.onSuccess(true);
    } catch (err) {
      cb.onError(err);
    }
  }

  /**
   * Used to clear the logger display. This is applicable only to certain transports, such
   * as socket transports that direct logs to a UI.
   */
  clear() {}

  protected _write(msg: string): this {
    if (this._writable) {
      this._writable = this._stream.write(msg + '\n', 'utf-8');
    } else {
      this._buffer.push(msg + '\n');
      if (!this._drainRegistered) {
        this._stream.once('drain', this.flush);
        this._drainRegistered = true;
      }
    }
    return this;
  }

  /**
   * Used only if buffering (if options.buffer is > 0)
   * Flushes everything in the buffer and starts a timer to automatically
   * flush again after options.buffer time
   */
  public flush(): Promise<void> {
    this._drainRegistered = false;
    if (this._buffer.length) {
      let flushing = this._buffer;
      this._buffer = [];
      flushing.forEach((msg) => this._write(msg));
    }
    return Promise.resolve();
  }

  public end(): Promise<void> {
    return this.flush()
      .then(() => {
        this.bReady = false;
        if (this._stream) {
          return this._stream.end();
        }
      })
      .then(() => {
        return Promise.resolve();
      });
  }

  public stop(): Promise<void> {
    return this.end().then(() => {
      if (this._stream) {
        this._stream.destroy();
      }
      this._stream = undefined;
    });
  }

  toString() {
    return 'File (' + this._path + ')';
  }

  getOptions() {
    return { path: this._path };
  }

  protected formatLogMessage(params: LogMessage) {
    let opts = {
      timestamp: this.timestampFormat,
      sid: this.bIncludeSid,
      static: this.bIncludeStatic,
      colorize: false,
      template: this.options.template
    };
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
