import { Dict, Integer, isDict, isString } from '@epdoc/typeutil';
import { LogLevel, LogLevelDef, LogLevelValue } from './level';
import { AppTimer } from './lib/app-timer';
import { LogManager } from './log-manager';
import { StyleOptions } from './style';

export type TimePrefix = 'local' | 'utc' | 'elapsed' | 'interval' | false;
export type TransportType = string;

export function isValidTimePrefix(val: any): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val);
}

export type LoggerLineFormatOpts = Partial<{
  tabSize: Integer;
  stylize: boolean;
  timestamp: StyleFormatterFn;
  level: StyleFormatterFn;
  reqId: StyleFormatterFn;
  sid: StyleFormatterFn;
  emitter: StyleFormatterFn;
  action: StyleFormatterFn;
  data: StyleFormatterFn;
  suffix: StyleFormatterFn;
  elapsed: StyleFormatterFn;
}>;

/** LoggerLine options that are constant across all lines of a logger instance. */
export type LoggerLineOpts = Partial<{
  logMgr: LogManager;
  msg: LogMessage;
  // style: Style;
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

// export type LoggerRunOpts = Partial<{
//   /**
//    * If true, logging will be enabled immediately without needing to call start().
//    * If no transports are provided, a default console transport will be added.
//    * @type {boolean}
//    */
//   autoRun: boolean;

//   /**
//    * If true, all transports must be ready before messages are written.
//    * If false, messages can be written as soon as any transport is ready.
//    * @type {boolean}
//    */
//   requireAllTransportsReady: boolean;
// }>;

export type LogMessageFn = (msg: LogMessage) => void;
export type StyleFormatterFn = (text: unknown[]) => string;
export type LineFormatterFn = (opts: LogMessage) => string;

export type SeparatorOpts = Partial<{
  char: string;
  length: number;
}>;

export type LogMgrDefaults = Partial<{
  // show: LoggerShowOpts;
  // style: Style;
  // separatorOpts: SeparatorOpts;
  levelThreshold: LogLevelValue;
  errorStackThreshold: LogLevelValue;
  msgConsts: LogMessageConsts;
}>;

export type LogMsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

/**
 * Properties of a LogMessage that are likely to be constant across a number of
 * log messages.
 */
export type LogMessageConsts = Partial<{
  /** The name of the emitter, which is typically a string. */
  emitter: string | string[];
  /** The action to log, which is a verb indicating the action being logged. */
  action: string;
  /** The request ID, in the event this log message is associated with a server request. */
  reqId: string;
  /** The session ID, in the event this log message is associated with a
   * session. This will come from the context of the message. */
  sid: string;
  /** The static data, which is typically a string. TODO define what this is. */
  static: string;
}>;

/**
 * Properties of a log message. Only the 'message' property is the descriptive string.
 */
export type LogMessage = LogMessageConsts &
  Partial<{
    /** The timer to use for the message, in order to display the current time or elapsed time.*/
    timer: AppTimer;
    /** The level of the message, as a LogLevelValue */
    level: LogLevelValue;
    /** The message to log. If this is not defined, then the message is
     * generated from the parrts array. */
    message: any;
    /** Data to log and display as JSON or as a stringified JSON object */
    data: Dict;
    /** An array of strings and other objects to be formatted and logged and put
     * in the message property. */
    parts: LogMsgPart[];
    /** The formatter to use for the message. If this is not defined, then the message is
     * formatted using util.format.
     * @deprecated
     */
    partsFormatter: LineFormatterFn;
    /** Indicates if this is a separator line, in which case message is ignored */
    separator: boolean;
  }>;

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
  separatorOpts: SeparatorOpts;
  logLevel: LogLevel;
  timer: AppTimer;
  consts: LogMessageConsts;
  levelThreshold: LogLevelValue;
  format: LoggerLineFormatOpts;
}>;

export function isTransportOptions(val: any): val is TransportOptions {
  return isDict(val) && isString(val.name);
}

export type LogMgrOpts = Partial<{
  timer: AppTimer;
  defaults: LogMgrDefaults;
  logLevels: LogLevelDef;
  styleOpts: StyleOptions;
  // run: LoggerRunOpts;
  /**
   * Array of transport options for logging.
   * Each transport must include a 'name' property.
   * @type {TransportOptions[]}
   */
  transports: TransportOptions[];
}>;
