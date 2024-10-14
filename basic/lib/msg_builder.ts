import chalk from 'chalk';
import * as base from '../core/core-index.ts';

import type { StyleFormatters } from '../types.ts';

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
  _timePrefix: chalk.gray,
} as const;

export class Style extends base.Style {
  constructor() {
    super();
    this.setStyles(styleFormatters);
  }
}

export type StyleName = keyof typeof styleFormatters;

/**
 * Message Builder class for styling messages. Extends the BaseMsgBuilder to
 * provide custom formatting using chained messages. If you prefer to declare
 * and use a custom set of formatting metchods, declare your own MsgBuilder and
 * pass it to the LogManager. s
 */
export class MsgBuilder extends base.MsgBuilder {
  public text(...args: unknown[]): this {
    return this.stylize(styleFormatters.text, ...args);
  }
  public h1(...args: unknown[]): this {
    return this.stylize(styleFormatters.h1, ...args);
  }
  public h2(...args: unknown[]): this {
    return this.stylize(styleFormatters.h2, ...args);
  }
  public h3(...args: unknown[]): this {
    return this.stylize(styleFormatters.h3, ...args);
  }
  public action(...args: unknown[]): this {
    return this.stylize(styleFormatters.action, ...args);
  }
  public label(...args: unknown[]): this {
    return this.stylize(styleFormatters.label, ...args);
  }
  public highlight(...args: unknown[]): this {
    return this.stylize(styleFormatters.highlight, ...args);
  }
  public value(...args: unknown[]): this {
    return this.stylize(styleFormatters.value, ...args);
  }
  public path(...args: unknown[]): this {
    return this.stylize(styleFormatters.path, ...args);
  }
  public date(...args: unknown[]): this {
    return this.stylize(styleFormatters.date, ...args);
  }
  public warn(...args: unknown[]): this {
    return this.stylize(styleFormatters.warn, ...args);
  }
  public error(...args: unknown[]): this {
    return this.stylize(styleFormatters.error, ...args);
  }
  public strikethru(...args: unknown[]): this {
    return this.stylize(styleFormatters.strikethru, ...args);
  }
}
