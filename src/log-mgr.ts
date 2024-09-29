import { LogLevelDef } from './levels';
import { AppTimer } from './lib/app-timer';
import { LogManager as OriginalLogManager } from './log-manager';
import { Logger as OriginalLogger } from './logger/base';
import { MsgBuilder as OriginalMsgBuilder } from './msg-builder/base';
import { styleFormatters } from './msg-builder/default';
import { } from './style';
import { defaultConsoleTransportOpts } from './transports/console';
import { LogMessage, LogMessageConsts, LogMgrOpts, StyleFormatters } from './types';

import * as DefaultStyle from './msg-builder/default';


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

// const styleFormatters: StyleFormatters = {
//   text: chalk.whiteBright,
//   h1: chalk.bold.magenta,
//   h2: chalk.magenta,
//   h3: chalk.green,
//   action: chalk.black.bgYellow,
//   label: chalk.blue,
//   highlight: chalk.magentaBright,
//   value: chalk.blueBright,
//   path: chalk.blue,
//   date: chalk.cyanBright,
//   warn: chalk.cyan,
//   error: chalk.bold.redBright,
//   strikethru: chalk.inverse,
//   _reqId: chalk.yellowBright,
//   _sid: chalk.yellow,
//   _emitter: chalk.green,
//   _action: chalk.blue,
//   _plain: chalk.white,
//   _suffix: chalk.white,
//   _elapsed: chalk.white,
//   _errorPrefix: chalk.red,
//   _warnPrefix: chalk.cyan,
//   _infoPrefix: chalk.gray,
//   _verbosePrefix: chalk.gray,
//   _debugPrefix: chalk.gray,
//   _sillyPrefix: chalk.gray,
//   _httpPrefix: chalk.gray,
//   _timePrefix: chalk.gray
// } as const;

// export type StyleName = keyof typeof styleFormatters;



export type MsgBuilder = OriginalMsgBuilder & {
  [key in LogLevelName]: (...args: any[]) => MsgBuilder; // Ensure dynamic methods return LoggerLineInstance
};
export type Logger = OriginalLogger & {
  [key in LogLevelName]: (...args: any[]) => Logger; // Ensure dynamic methods return LoggerInstance
};

const defaultLogMgrOpts: LogMgrOpts = {
  defaults: {
    show:{}
  },
  logLevels: defaultLogLevelDef,
  transports: [defaultConsoleTransportOpts]
};

export class LogMgr extends OriginalLogManager {
  protected _levelDefs: LogLevelDef;
  protected _styleDefs: StyleFormatters;

  constructor(
    options: LogMgrOpts,
    styleDefs: StyleFormatters = styleFormatters
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

export function createLogMgr(options:LogMgrOpts): LogManager {

  const logMgrOpts: LogMgrOpts = Object.assign({},options)
  if( !logMgrOpts.timer ){
    logMgrOpts.timer = new AppTimer();
  }
  if( !logMgrOpts.logLevels ) {
    logMgrOpts.logLevels =
  }

  const logMgr: LogManager = new LogManager(logMgrOpts);

  return logMgr;
}


export class MyLineBuilder extends MsgBuilder {
  constructor(logMgr:LogManager,msg:LogMessage) {
    super(logMgr,msg)
    this.addStyleMethods(DefaultStyle.style.styleNames)
  }
}

export type MyLineBuilderPlus = MyLineBuilder & {[key in DefaultStyle.MethodName]:
(...args: any[]) => MyLineBuilderPlus;};
