import { isString } from '@epdoc/typeutil';
import fs from 'node:fs';
import path from 'node:path';
import type { LogMgr } from '../core/index.ts';
import type { TransportOptions } from '../types.ts';
import type { LogTransport, LogTransportOpenCallbacks } from './base.ts';

export const defaultFileTransportOpts: FileTransportOptions = {
  type: 'file',
  path: 'logs/app.log',
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: false,
    action: false,
    data: false,
  },
  format: {
    type: 'string',
    tabSize: 2,
    colorize: false,
  },
};

export type FileTransportOptions = TransportOptions & {
  path: string;
};

export function getNewTransport(logMgr: LogMgr, options: FileTransportOptions) {
  return new FileTransport(logMgr, options);
}

export class FileTransport extends LogTransport {
  protected _path: string;
  protected _stream: fs.WriteStream;
  protected _writable = false;
  protected _buffer = []; // Used in case of stream backups
  protected _drainRegistered = false;

  constructor(logMgr: LogMgr, options: FileTransportOptions) {
    super(logMgr, options);
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
      const folder = path.dirname(this._path);
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

  protected writeString(msg: string): this {
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
      flushing.forEach((msg) => this.writeString(msg));
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
    return `${this.uid} (${this._path})`;
  }

  getOptions() {
    return { path: this._path };
  }
}
