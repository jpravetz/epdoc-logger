import { type Dict, type Integer, isDict, isString } from '@epdoc/typeutil';
import type { AppTimer } from './app-timer.ts';
import type { LogLevelName, LogLevelValue } from './levels.ts';
import type { LogMgr } from './logmgr.ts';

export type Context = Dict;

export type TimePrefix = 'local' | 'utc' | 'elapsed' | 'interval' | string | false;
export type FormatterType = 'string' | 'json' | 'json-array' | 'template' | string;
export type TransportType = string;

export function isValidTimePrefix(val: unknown): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val as string);
}

export type MsgStringFormatOpts = Partial<{
  type: 'string';
  tabSize: Integer;
  colorize: boolean;
}>;
export type MsgJsonFormatOpts = {
  type: 'json';
};
export type MsgJsonArrayFormatOpts = {
  type: 'json-array';
};
export type MsgTemplateFormatOpts = {
  type: 'template';
  template: string;
};

export type MsgBuilderFormatOpts =
  | MsgStringFormatOpts
  | MsgJsonFormatOpts
  | MsgJsonArrayFormatOpts
  | MsgTemplateFormatOpts;

// export type LoggerLineStyleOpts = Partial<{
//   timestamp: StyleFormatterFn;
//   level: StyleFormatterFn;
//   reqId: StyleFormatterFn;
//   sid: StyleFormatterFn;
//   emitter: StyleFormatterFn;
//   action: StyleFormatterFn;
//   data: StyleFormatterFn;
//   suffix: StyleFormatterFn;
//   elapsed: StyleFormatterFn;
// }>;

/** LoggerLine options that are constant across all lines of a logger instance. */
export type LoggerLineOpts = Partial<{
  logMgr: LogMgr;
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

export type StyleFormatters = Record<string, StyleFormatterFn>;

export type StyleOptions = {
  dateFormat?: string;
  styles?: StyleFormatters;
};

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

export type LogContextParams = Partial<{
  /** The request ID, in the event this log message is associated with a server request. */
  reqId: string;
  /** The session ID, in the event this log message is associated with a
   * session. This will come from the context of the message. */
  sid: string;
}>;

/**
 * Properties of a LogMessage that are likely to be constant across a number of
 * log messages.
 */
export type LogMessageConsts = LogContextParams &
  Partial<{
    /** The name of the emitter, which is typically a string. */
    emitter: string | string[];
    /** The action to log, which is a verb indicating the action being logged. */
    action: string;
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

export type TransportOptions = Partial<{
  type: TransportType; // not required internally
  show: LoggerShowOpts;
  separator: SeparatorOpts;
  // logLevel: LogLevelName | LogLevelValue;
  // timer: AppTimer;
  // consts: LogMessageConsts;
  levelThreshold: LogLevelName | LogLevelValue;
  errorStackThreshold: LogLevelName | LogLevelValue;
  format: MsgBuilderFormatOpts;
  // style: Style;
  options: Dict;
}>;

export function isTransportOptions(val: any): val is TransportOptions {
  return isDict(val) && isString(val.name);
}
