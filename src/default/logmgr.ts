import * as original from '../core';
import { LogLevels } from '../log-levels';
import { Context } from '../types';
import { Logger, logLevelDefs } from './logger';

export class LogMgr extends original.LogMgr {
  constructor() {
    super();
    this._logLevels = new LogLevels(logLevelDefs);
  }

  getLogger(emitter: string, ctx?: Context): Logger {
    return new Logger(this).emitter(emitter).context(ctx);
  }
}
