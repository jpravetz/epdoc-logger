import { Milliseconds } from '@epdoc/timeutil';
import { Dict, Integer, isDict, isString } from '@epdoc/typeutil';
import { LogLevelDef, LogLevelValue } from './level';
import { Style } from './styles';

export type TimePrefix = 'local' | 'utc' | 'elapsed' | false;
export type TransportType = string;

export function isValidTimePrefix(val: any): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val);
}

export type LoggerLineFormatOpts = Partial<{
  tabSize: Integer;
  stylize: boolean;
  style: any;
}>;

export type LoggerShowOpts = Partial<{
  timestamp: TimePrefix;
  level: boolean;
  reqId: boolean;
  sid: boolean;
  static: boolean;
  emitter: boolean;
  action: boolean;
  data: boolean;
  elapsed: boolean; // not sure if we will show this
}>;

export type LoggerRunOpts = Partial<{
  /**
   * If true, logging will be enabled immediately without needing to call start().
   * If no transports are provided, a default console transport will be added.
   * @type {boolean}
   */
  autoRun: boolean;

  /**
   * If true, all transports must be ready before messages are written.
   * If false, messages can be written as soon as any transport is ready.
   * @type {boolean}
   */
  allTransportsReady: boolean;
}>;

export type SeparatorOpts = Partial<{
  char: string;
  length: number;
}>;

export type LogMgrDefaults = Partial<{
  show: LoggerShowOpts;
  style: Style;
  separatorOpts: SeparatorOpts;
  levelThreshold: LogLevelValue;
  errorStackThreshold: LogLevelValue;
}>;

export type LogMessage = {
  time?: Date;
  timeDiff?: Milliseconds;
  emitter?: string;
  action?: string;
  level?: LogLevelValue;
  reqId?: string;
  static?: string;
  message?: string;
  data?: Dict;
};

export const consoleTransportDefaults: TransportOptions = {
  name: 'console',
  show: {
    timestamp: 'elapsed',
    level: true,
    reqId: false,
    sid: false,
    static: false,
    emitter: true,
    action: true,
    data: true
  }
};

export type TransportOptions = Partial<{
  name: TransportType; // not required internally
  show: LoggerShowOpts;
  time: TimePrefix;
  levelThreshold: LogLevelValue;
  format: LoggerLineFormatOpts;
}>;

export function isTransportOptions(val: any): val is TransportOptions {
  return isDict(val) && isString(val.name);
}

export type LogMgrOpts = Partial<{
  timer: any;
  t0: Date;
  defaults: LogMgrDefaults;
  logLevels: LogLevelDef;
  run: LoggerRunOpts;
  /**
   * Array of transport options for logging.
   * Each transport must include a 'name' property.
   * @type {TransportOptions[]}
   */
  transports: TransportOptions[];
}>;
