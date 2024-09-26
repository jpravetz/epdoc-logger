import { Dict } from '@epdoc/typeutil';
import { LogMessage } from '../../types';
import { TransportFormatter } from './base';

export function getNewJsonFormatter(): TransportFormatter {
  return new TransportJsonFormatter();
}

export class TransportJsonFormatter extends TransportFormatter {
  get name(): string {
    return 'string';
  }

  format(msg: LogMessage): any {
    this._msg = msg;
    let json: Dict = {
      timestamp: this.getTimeString(),
      level: this._logLevels.asName(this._msg.level).toUpperCase,
      emitter: this._msg.emitter,
      action: this._msg.action,
      // data: this._showOpts.dataObjects ? this._msg.data : JSON.stringify(this._msg.data),
      message: this._msg.message
      // static: this._showOpts.dataObjects ? this._msg.static : JSON.stringify(this._msg.static)
    };
    // if (options.levelMap && options.levelMap.verbose && json.level === 'VERBOSE') {
    //   json.level = options.levelMap.verbose;
    // }
    // if (options.levelUppercase) {
    //   json.level = json.level.toUpperCase();
    // }
    if (this._msg.sid) {
      json.sid = this._msg.sid;
      json.reqId = this._msg.reqId;
    }
    if (this._showOpts.static) {
      json.static = this._msg.static;
    }
    if (this._msg.message instanceof Array) {
      json.message = this._msg.message.join('\n');
    }
    return json;
  }
}
