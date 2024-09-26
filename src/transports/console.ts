import { LogMessage, TransportOptions } from '../types';
import { LogTransport } from './base';

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

export function getNewConsoleTransport(options: TransportOptions) {
  return new ConsoleTransport(options);
}

export class ConsoleTransport extends LogTransport {
  validateOptions(previous?: LogTransport) {
    return null;
  }

  open(onSuccess) {
    this.bReady = true;
    onSuccess && onSuccess(true);
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

  protected formatLogMessage(params: LogMessage) {
    const showOpts = this._opts;
    var opts = {
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
      var json = format.paramsToJson(params, opts);
      return JSON.stringify(json);
    } else {
      var json = format.paramsToJsonArray(params, opts);
      return JSON.stringify(json);
    }
  }
}
