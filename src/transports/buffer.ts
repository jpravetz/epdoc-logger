import { TransportOptions } from '../types';
import { LogTransport } from './base';

export const defaultBufferTransportOpts: TransportOptions = {
  name: 'buffer',
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: false,
    action: false,
    data: false
  }
};

export function getNewTransport(options: TransportOptions) {
  return new BufferTransport(options);
}

export class BufferTransport extends LogTransport {
  protected _buffer: string[] = [];

  constructor(options: TransportOptions) {
    super(options);
    this._showOpts = this._showOpts ?? defaultBufferTransportOpts.show;
  }

  validateOptions(previous?: LogTransport) {
    return null;
  }

  open(onSuccess) {
    this.bReady = true;
    onSuccess && onSuccess(true);
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

  protected _write(msg: string): this {
    this._buffer.push(msg);
    return this;
  }

  toString() {
    return 'Buffer';
  }

  getOptions() {
    return undefined;
  }
}
