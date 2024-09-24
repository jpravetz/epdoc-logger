import chalk from 'chalk';
import { LogLevel, LogLevelDef } from './level';
import { LoggerLine } from './line';
import { LogManager } from './log-manager';
import { Logger } from './logger';
import { StyleDef, StyleDefs } from './styles';
import { LogMessageConsts, LogMgrOpts } from './types';

const defaultLogLevelDef: LogLevelDef = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  trace: 6,
  skip: 9
} as const;

const defaultStyleDefs: StyleDefs = {
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

export type ColorStyleName = keyof typeof defaultStyleDefs;
export type LogLevelName = keyof typeof defaultLogLevelDef;
export type LoggerLineInstance = LoggerLine & {
  [key in LogLevelName]: (...args: any[]) => LoggerLineInstance; // Ensure dynamic methods return LoggerLineInstance
};
export type LoggerInstance = Logger & {
  [key in LogLevelName]: (...args: any[]) => LoggerLineInstance; // Ensure dynamic methods return LoggerInstance
};

export class LogMgr extends LogManager {
  protected _levelDefs: LogLevelDef;
  protected _styleDefs: StyleDef;

  constructor(options: LogMgrOpts, levelDefs: LogLevelDef, styleDefs: StyleDefs) {
    super(options);
    this._logLevels = new LogLevel(levelDefs);
    this._levelDefs = levelDefs;
    this._styleDefs = styleDefs;
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
  return new LogMgr(options, defaultLogLevelDef, defaultStyleDefs);
}
