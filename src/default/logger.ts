import * as original from '../core';
import { LogLevelDef } from '../log-levels';
import { MsgBuilder } from './msg-builder';

export const logLevelDefs: LogLevelDef = {
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

/**
 * Extend our Logger with custom new-log-message chainable methods. If you wish
 * to support a different set of log levels, duplicate this file and the other
 * files in this directory and import those instead.
 *
 * The methods are implemented in a subclass rather than being dynamically added
 * to the original Logger base class due to difficulties in declaring TypeScript
 * types and having them apply to objects returned by a base class.
 */
export class Logger extends original.Logger {
  error(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.error, ...args) as MsgBuilder;
  }
  warn(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.warn, ...args) as MsgBuilder;
  }
  help(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.help, ...args) as MsgBuilder;
  }
  data(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.data, ...args) as MsgBuilder;
  }
  info(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.info, ...args) as MsgBuilder;
  }
  debug(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.debug, ...args) as MsgBuilder;
  }
  prompt(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.prompt, ...args) as MsgBuilder;
  }
  verbose(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.verbose, ...args) as MsgBuilder;
  }
  input(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.input, ...args) as MsgBuilder;
  }
  silly(...args: any[]): MsgBuilder {
    return this.level(logLevelDefs.silly, ...args) as MsgBuilder;
  }
}
