import { LogLevel } from '../../level';
import { LoggerLineFormatOpts, LoggerShowOpts, LogMessage } from '../../types';
import { TransportFormatterOpts } from './factory';

export class TransportFormatter {
  protected _msg: LogMessage;
  protected _showOpts: LoggerShowOpts;
  protected _formatOpts: LoggerLineFormatOpts;
  protected _logLevels: LogLevel;

  constructor() {}

  get name(): string {
    return 'base';
  }

  init(opts: TransportFormatterOpts): this {
    this._showOpts = opts.show;
    this._formatOpts = opts.format;
    this._logLevels = opts.logLevels;
    return this;
  }

  format(msg: LogMessage): any {
    return '';
  }

  getTimeString(): string {
    return this._msg.timer.getTimeForPrefix(this._showOpts.timestamp);
  }
}
