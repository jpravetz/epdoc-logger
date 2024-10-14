import * as base from '../core/core-index.ts';
import { LogLevels } from '../log-levels.ts';
import type { Context } from '../types.ts';
import { Logger, logLevelDefs } from './logger.ts';

export class LogMgr extends base.LogMgr {
  constructor() {
    super();
    this._logLevels = new LogLevels(logLevelDefs);
  }

  getLogger(emitter: string, ctx?: Context): Logger {
    return new Logger(this).emitter(emitter).context(ctx);
  }
}
