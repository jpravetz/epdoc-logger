import type { LogMgr } from '../core/logmgr.ts';
import type { TransportOptions } from '../types.ts';
import type { LogTransport, LogTransportOpenCallbacks } from './base.ts';

export const defaultBufferTransportOpts: TransportOptions = {
  type: 'buffer',
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

export function getNewTransport(logMgr: LogMgr, options: TransportOptions) {
  return new BufferTransport(logMgr, options);
}

export class BufferTransport extends LogTransport {
  protected _buffer: string[] = [];

  constructor(logMgr: LogMgr, options: TransportOptions) {
    super(logMgr, options);
    this._showOpts = this._showOpts ?? defaultBufferTransportOpts.show;
  }

  validateOptions(previous?: LogTransport) {
    return null;
  }

  open(cb: LogTransportOpenCallbacks) {
    this.bReady = true;
    cb.onSuccess(true);
  }

  get type(): string {
    return 'buffer';
  }

  get writable(): boolean {
    return true;
  }

  public flush(): Promise<void> {
    return Promise.resolve();
  }

  protected writeString(msg: string): this {
    this._buffer.push(msg);
    return this;
  }

  getOptions() {
    return undefined;
  }
}
