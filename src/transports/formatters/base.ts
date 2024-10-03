import { LogMgr, Style } from '../../core';
import { LogLevels } from '../../log-levels';
import { LoggerShowOpts, LogMessage, MsgBuilderFormatOpts } from '../../types';
import { TransportFormatterOpts } from './factory';

export class TransportFormatter {
  protected _logMgr: LogMgr;
  protected _msg: LogMessage;
  protected _showOpts: LoggerShowOpts;
  protected _formatOpts: MsgBuilderFormatOpts;
  // protected _style: Style;

  constructor(logMgr: LogMgr) {
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

  get logLevels(): LogLevels {
    return this._logMgr.logLevels;
  }

  get style(): Style {
    return this._logMgr.style;
  }

  format(msg: LogMessage): any {
    return '';
  }

  getTimeString(): string {
    return this._msg.timer.getTimeForPrefix(this._showOpts.timestamp);
  }
}
