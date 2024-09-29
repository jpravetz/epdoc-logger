import chalk from 'chalk';
import { LogManager } from '../log-manager';
import { LogMessage, StyleFormatters } from '../types';
import { MsgBuilder } from './base';

export const styleFormatters: StyleFormatters = {
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

export function newDefaultMsgBuilder(logMgr: LogManager, msg: LogMessage): DefaultMsgBuilder {
  return new DefaultMsgBuilder(logMgr, msg);
}

/**
 * Message Builder class for styling messages. Extends the BaseMsgBuilder to
 * provide custom formatting using chained messages. If you prefer to declare
 * and use a custom set of formatting metchods, declare your own MsgBuilder and
 * pass it to the LogManager. s
 */
export class DefaultMsgBuilder extends MsgBuilder {
  public text(...args: any[]): this {
    return this.stylize(styleFormatters.text, ...args);
  }
  public h1(...args: any[]): this {
    return this.stylize(styleFormatters.h1, ...args);
  }
  public h2(...args: any[]): this {
    return this.stylize(styleFormatters.h2, ...args);
  }
  public h3(...args: any[]): this {
    return this.stylize(styleFormatters.h3, ...args);
  }
  public action(...args: any[]): this {
    return this.stylize(styleFormatters.action, ...args);
  }
  public label(...args: any[]): this {
    return this.stylize(styleFormatters.label, ...args);
  }
  public highlight(...args: any[]): this {
    return this.stylize(styleFormatters.highlight, ...args);
  }
  public value(...args: any[]): this {
    return this.stylize(styleFormatters.value, ...args);
  }
  public path(...args: any[]): this {
    return this.stylize(styleFormatters.path, ...args);
  }
  public date(...args: any[]): this {
    return this.stylize(styleFormatters.date, ...args);
  }
  public warn(...args: any[]): this {
    return this.stylize(styleFormatters.warn, ...args);
  }
  public error(...args: any[]): this {
    return this.stylize(styleFormatters.error, ...args);
  }
  public strikethru(...args: any[]): this {
    return this.stylize(styleFormatters.strikethru, ...args);
  }
}
