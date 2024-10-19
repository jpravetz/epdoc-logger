import { type Integer, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/typeutil';
import { StringEx } from './util.ts';

const DEFAULT_TAB_SIZE = 2;

export type StyleFormatterFn = (str: string) => string;
export type StyleArg = string | number;

export type LogMsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

export interface IMsgBuilder {
  clear(): this;
  setInitialString(...args: StyleArg[]): this;
  indent(n: Integer | string): this;
  tab(n: Integer): this;
  comment(...args: string[]): this;
  emit(...args: unknown[]): string;
}

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class MsgBuilder implements IMsgBuilder {
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  // protected _lineFormat: LoggerLineFormatOpts;

  protected _msgIndent: string = '';
  protected _msgParts: LogMsgPart[] = [];
  protected _suffix: string[] = [];
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;

  constructor() {}

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._msgParts = [];
    return this;
  }

  setInitialString(...args: StyleArg[]): this {
    if (args.length) {
      const count = StringEx(args[0]).countTabsAtBeginningOfString();
      if (count) {
        this.tab(count);
        args[0] = String(args[0]).slice(count);
      }
    }
    return this.stylize(null, ...args);
  }

  indent(n: Integer | string = DEFAULT_TAB_SIZE): this {
    if (isInteger(n)) {
      this.addMsgPart(' '.repeat(n - 1));
    } else if (isNonEmptyString(n)) {
      this.addMsgPart(n);
    }
    return this;
  }

  /**
   * Sets the indentation level of this line of log output..
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    this._msgIndent = ' '.repeat(n * this._tabSize - 1);
    return this;
  }

  /**
   * Adds a comment to the end of the log line.
   * @param { unknown} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  comment(...args: string[]): this {
    this.appendSuffix(...args);
    return this;
  }

  protected addMsgPart(str: string, style?: StyleFormatterFn | null): this {
    // const _style = this.stylizeEnabled ? style : undefined;
    const part: LogMsgPart = { str: str };
    if (style) {
      part.style = style;
    }
    this._msgParts.push(part);
    return this;
  }

  protected appendMsg(...args: unknown[]): this {
    if (isNonEmptyArray(args)) {
      this.addMsgPart(args.join(' '));
    }
    return this;
  }

  protected appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  stylize(style: StyleFormatterFn | null, ...args: StyleArg[]): this {
    if (isNonEmptyArray(args)) {
      this.addMsgPart(args.join(' '), style);
    }
    return this;
  }

  /**
   * Adds plain text to the log line.
   * @param { unknown} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  plain(...args: unknown[]): this {
    return this.appendMsg(...args);
  }

  // protected addElapsed(): this {
  //   if (this._showElapsed && this._msg.timer) {
  //     this.addMsgPart(
  //       `${this._msg.timer.getTimeForPrefix('elapsed')} (${this._msg.timer.getTimeForPrefix('interval')})`,
  //       this.style.getDefFromName('elapsed')
  //     );
  //     // this.stylize('_elapsed', `${et.total} (${et.interval})`);
  //   }
  //   return this;
  // }

  /**
   * Emits the log line with elapsed time. This is a convenience method for
   * emitting the log line with elapsed time without having to call `elapsed()`
   * first.
   * @param { unknown[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   */
  emitWithTime(...args: unknown[]): string {
    this._showElapsed = true;
    return this.emit(...args);
  }

  /**
   * Emits the log line with elapsed time (Emit With Time = EWT). This is a
   * convenience method for emitting the log line with elapsed time without
   * having to call `elapsed()` first.
   * @param { unknown[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   * @see emitWithTime()
   */
  ewt(...args: unknown[]): string {
    this._showElapsed = true;
    return this.emit(...args);
  }

  /**
   * Emits the log line.
   * @param { unknown[]} args - The arguments to emit.
   * @returns {void}
   * @see ewt()
   * @see emitWithTime()
   */
  emit(...args: unknown[]): string {
    this.appendMsg(...args);
    let result = '';
    result = this.formatParts();
    this.clear();
    return result;
  }

  partsAsString(): string {
    return this._msgParts?.map((p) => p.str).join(' ') || '';
  }

  protected formatParts(): string {
    const parts: string[] = [];
    this._msgParts.forEach((part: LogMsgPart) => {
      if (part.style) {
        parts.push(part.style(part.str));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }
}
