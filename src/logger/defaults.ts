import { LogLevelDef, LogLevels } from '../levels';
import { LogManager } from '../log-manager';
import { MsgBuilder } from '../msg-builder/base';
import { Logger } from './base';

const logLevelDefs: LogLevelDef = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  debug: 5,
  prompt: 6,
  verbose: 7,
  input: 8,
  silly: 9
} as const;

export type LogLevelName = keyof typeof logLevelDefs;

export const logLevels = new LogLevels(logLevelDefs);

export function newDefaultLogger(logMgr?: LogManager): Logger {
  return new DefaultLogger().logManager(logMgr).resolve();
}

export class DefaultLogger extends Logger {
  error(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.error, ...args);
  }
  warn(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.warn, ...args);
  }
  help(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.help, ...args);
  }
  data(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.data, ...args);
  }
  info(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.info, ...args);
  }
  debug(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.debug, ...args);
  }
  prompt(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.prompt, ...args);
  }
  verbose(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.verbose, ...args);
  }
  input(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.input, ...args);
  }
  silly(...args: any[]): MsgBuilder {
    return this.initLine(logLevelDefs.silly, ...args);
  }
}
