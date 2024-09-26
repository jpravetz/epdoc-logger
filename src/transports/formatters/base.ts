import { dateUtil } from '@epdoc/timeutil';
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
    const timePrefix = this._showOpts.timestamp;
    if (timePrefix === 'elapsed') {
      return this._msg.timer.measureFormatted().total;
    } else if (timePrefix === 'local') {
      return dateUtil(this._msg.time).format('HH:mm:ss');
    } else if (timePrefix === 'utc') {
      return dateUtil(this._msg.time).tz('Z').format('HH:mm:ss');
    }
  }
}
