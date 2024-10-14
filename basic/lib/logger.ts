import * as core from '@scope/core';
// import type { LogLevelDef } from '../log-levels.ts';
import { LogLevelDef } from '../../core/lib/levels.ts';
import type { MsgBuilder } from './msg_builder.ts';

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
  silly: 9,
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
export class Logger extends core.Logger {
  error(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.error, ...args) as MsgBuilder;
  }
  warn(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.warn, ...args) as MsgBuilder;
  }
  help(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.help, ...args) as MsgBuilder;
  }
  data(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.data, ...args) as MsgBuilder;
  }
  info(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.info, ...args) as MsgBuilder;
  }
  debug(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.debug, ...args) as MsgBuilder;
  }
  prompt(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.prompt, ...args) as MsgBuilder;
  }
  verbose(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.verbose, ...args) as MsgBuilder;
  }
  input(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.input, ...args) as MsgBuilder;
  }
  silly(...args: unknown[]): MsgBuilder {
    return this.level(logLevelDefs.silly, ...args) as MsgBuilder;
  }
}
