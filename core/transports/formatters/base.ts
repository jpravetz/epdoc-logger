import * as core from '../../lib/index.ts';
import type { TransportFormatterOpts } from './factory.ts';

export class TransportFormatter {
  protected _logMgr: core.LogMgr;
  protected _msg: core.LogMessage;
  protected _showOpts: core.LoggerShowOpts;
  protected _formatOpts: core.MsgBuilderFormatOpts;
  // protected _style: Style;

  constructor(logMgr: core.LogMgr) {
    this._logMgr = logMgr;
  }

  get name(): string {
    return 'base';
  }

  init(opts: TransportFormatterOpts): this {
    this._showOpts = opts.show;
    this._formatOpts = opts.format;
    // this._style = opts.style;
    return this;
  }

  get logLevels(): core.LogLevels {
    return this._logMgr.logLevels;
  }

  get style(): core.Style {
    return this._logMgr.style;
  }

  format(msg: core.LogMessage): any {
    return '';
  }

  getTimeString(): string {
    return this._msg.timer?.getTimeForPrefix(this._showOpts.timestamp) ?? '';
  }
}
