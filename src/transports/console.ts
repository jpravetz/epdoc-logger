import { TransportOptions } from '../types';
import { LogTransport, LogTransportOpenCallbacks } from './base';

export const defaultConsoleTransportOpts: TransportOptions = {
  name: 'console',
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
  return new ConsoleTransport(options);
}

export class ConsoleTransport extends LogTransport {
  constructor(options: TransportOptions) {
    super(options);
    this._showOpts = this._showOpts ?? defaultConsoleTransportOpts.show;
  }

  validateOptions(previous?: LogTransport) {
    return null;
  }

  open(cb: LogTransportOpenCallbacks) {
    this.bReady = true;
    cb.onSuccess(true);
  }

  get type(): string {
    return 'console';
  }

  get writable(): boolean {
    return true;
  }

  public flush(): Promise<void> {
    return Promise.resolve();
  }

  protected _write(msg: string): this {
    console.log(msg);
    return this;
  }

  toString() {
    return 'Console';
  }

  getOptions() {
    return undefined;
  }
}
