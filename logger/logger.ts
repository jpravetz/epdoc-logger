import type { ILogLevels, LevelName, LogLevel } from '@scope/levels';
import { cli } from '@scope/levels';
import type { ILogEmitter } from '@scope/message';
import { MsgBuilder } from '@scope/msg-console';
import type { CliLogger } from './cli.ts';

export class Logger implements CliLogger, ILogEmitter {
  protected _logLevels: ILogLevels;
  protected _threshold: LogLevel;

  constructor() {
    this._logLevels = cli.createLogLevels();
    this._threshold = this._logLevels.asValue(this._logLevels.defaultLevelName);
  }

  emit(level: LevelName, msg: string): void {
    if (this._logLevels.meetsThreshold(level, this._threshold)) {
      console.log(msg);
    }
  }

  setThreshold(level: LevelName | LogLevel): this {
    this._threshold = this._logLevels.asValue(level);
    return this;
  }

  get error(): MsgBuilder {
    return new MsgBuilder('ERROR', this);
  }
  get warn(): MsgBuilder {
    return new MsgBuilder('WARN', this);
  }
  get help(): MsgBuilder {
    return new MsgBuilder('HELP', this);
  }
  get data(): MsgBuilder {
    return new MsgBuilder('DATA', this);
  }
  get info(): MsgBuilder {
    return new MsgBuilder('INFO', this);
  }
  get debug(): MsgBuilder {
    return new MsgBuilder('DEBUG', this);
  }
  get prompt(): MsgBuilder {
    return new MsgBuilder('PROMPT', this);
  }
  get verbose(): MsgBuilder {
    return new MsgBuilder('VERBOSE', this);
  }
  get input(): MsgBuilder {
    return new MsgBuilder('INPUT', this);
  }
  get silly(): MsgBuilder {
    return new MsgBuilder('SILLY', this);
  }
}
