import chalk from 'chalk';
import { LogLevelDef } from '../level';
import { Style } from '../style';
import { StyleFormatters } from '../types';

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

export type MethodName = Exclude<keyof typeof styleFormatters, `_${string}`>;

// export class Style extends BaseStyle {
//   getDefFromName(name: StyleName): StyleFormatterFn {
//     return super.getDefFromName(name as string);
//   }
// }

export const style = new Style(styleFormatters);
