import { LogMgr } from '../core/logmgr';
import { TransportOptions } from '../types';
import { LogTransport, LogTransportOpenCallbacks } from './base';

export const defaultConsoleTransportOpts: TransportOptions = {
  type: 'console',
  format: {
    type: 'string',
    tabSize: 2,
    colorize: true
  },
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: true,
    action: true,
    data: true
  },
  separator: {
    char: '#',
    length: 80
  },
  levelThreshold: 'info',
  errorStackThreshold: 'error'
};

export function getNewTransport(logMgr: LogMgr, options: TransportOptions) {
  return new ConsoleTransport(logMgr, options);
}

export class ConsoleTransport extends LogTransport {
  constructor(logMgr: LogMgr, options: TransportOptions) {
    super(logMgr, options);
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

  protected writeString(msg: string): this {
    console.log(msg);
    return this;
  }

  getOptions() {
    return undefined;
  }
}
