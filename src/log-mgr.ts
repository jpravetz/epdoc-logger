import chalk from 'chalk';
import { LogLevelDef } from './level';
import { LogManager } from './log-manager';
import { Logger } from './logger';
import { LoggerMessageBuilder } from './msg-builder';
import { StyleFormatters } from './style';
import { defaultConsoleTransportOpts } from './transports/console';
import { LogMessageConsts, LogMgrOpts } from './types';

export namespace defaultLog {


 const logLevelDefs: LogLevelDef = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  trace: 6,
  skip: 9
} as const;

export type LogLevelName = keyof typeof logLevelDefs;

const styleFormatters: StyleFormatters = {
  text: chalk.whiteBright,
  h1: chalk.bold.magenta,
  h2: chalk.magenta,
  h3: chalk.green,
  action: chalk.black.bgYellow,
  label: chalk.blue,
  highlight: chalk.magentaBright,
  value: chalk.blueBright,
  path: chalk.blue,
  date: chalk.cyanBright,
  warn: chalk.cyan,
  error: chalk.bold.redBright,
  strikethru: chalk.inverse,
  _reqId: chalk.yellowBright,
  _sid: chalk.yellow,
  _emitter: chalk.green,
  _action: chalk.blue,
  _plain: chalk.white,
  _suffix: chalk.white,
  _elapsed: chalk.white,
  _errorPrefix: chalk.red,
  _warnPrefix: chalk.cyan,
  _infoPrefix: chalk.gray,
  _verbosePrefix: chalk.gray,
  _debugPrefix: chalk.gray,
  _sillyPrefix: chalk.gray,
  _httpPrefix: chalk.gray,
  _timePrefix: chalk.gray
} as const;

export type StyleName = keyof typeof styleFormatters;



export type LoggerLine = LoggerMessageBuilder & {
  [key in LogLevelName]: (...args: any[]) => LoggerLine; // Ensure dynamic methods return LoggerLineInstance
};
export type Logger = Logger & {
  [key in LogLevelName]: (...args: any[]) => LoggerLine; // Ensure dynamic methods return LoggerInstance
};

const defaultLogMgrOpts: LogMgrOpts = {
  defaults: {
    show:
  },
  logLevels: defaultLogLevelDef,
  transports: [defaultConsoleTransportOpts]
};

export class Mgr extends LogManager {
  protected _levelDefs: LogLevelDef;
  protected _styleDefs: StyleFormatters;

  constructor(
    options: LogMgrOpts,
    styleDefs: StyleFormatters = defaultStyleFormatters
  ) {
    super(options);
    this._levelDefs = levelDefs;
    this._styleDefs = styleDefs;
    this._requireAllTransportsReady = false;
    this.start();
  }

  getLogger(emitter: string, context: object): LoggerInstance {
    const msgConsts: LogMessageConsts = Object.assign({}, this._msgConsts, { emitter });
    return new Logger(
      this,
      msgConsts,
      this._logLevels,
      this._separatorOpts,
      context
    ) as unknown as LoggerInstance;
  }
}

export function createLogMgr(options: LogMgrOpts): LogMgr {
  return new Mgr(options);
}
}
