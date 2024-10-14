import { isArray } from '@epdoc/typeutil';
import type { LogMgr } from '../../core/logmgr.ts';
import type { LogMessage } from '../../types.ts';
import type { TransportFormatter } from './base.ts';

export function getNewFormatter(logMgr: LogMgr): TransportFormatter {
  return new TransportJsonArrayFormatter(logMgr);
}

export class TransportJsonArrayFormatter extends TransportFormatter {
  get name(): string {
    return 'json-arry';
  }

  format(msg: LogMessage): any {
    this._msg = msg;
    let json: any[] = [this.getTimeString(), this.logLevels.asName(this._msg.level).toUpperCase];
    if (this._msg.sid) {
      json.push(this._msg.sid);
      json.push(this._msg.reqId);
    }
    const emitter = isArray(this._msg.emitter) ? this._msg.emitter.join('.') : this._msg.emitter;
    json.push(emitter ? emitter : '');
    json.push(this._msg.action ? this._msg.action : '');
    json.push(this._msg.message);
    if (this._showOpts.static) {
      json.push(this._msg.static ? this._msg.static : {});
    }
    if (this._msg.data) {
      json.push(this._msg.data);
    }
    return json;
  }
}
