import { type Integer, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/typeutil';
import type { ILogLevels, LevelName, LogLevel } from '@scope/levels';
import { StringEx } from './util.ts';

const DEFAULT_TAB_SIZE = 2;

export type StyleFormatterFn = (text: unknown[]) => string;

export type LogMsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class MsgBuilder {
  protected _logLevels: ILogLevels;
  protected _level: LogLevel = 0;
  protected _threshold: LogLevel = 0;

  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  // protected _lineFormat: LoggerLineFormatOpts;

  protected _enabled: boolean = false;
  protected _msgIndent: string = '';
  protected _msgParts: LogMsgPart[] = [];
  protected _suffix: string[] = [];
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;

  constructor(logLevels: ILogLevels, level: LogLevel | LevelName) {
    this._logLevels = logLevels;
    this.setLevel(level);
  }

  protected get logLevels(): ILogLevels {
    return this._logLevels;
  }

  get level(): LogLevel {
    return this._level ?? this.logLevels.asValue(this.logLevels.defaultLevelName);
  }

  setLevel(val: LogLevel | LevelName): this {
    this._level = this.logLevels.asValue(val);
    this._enabled = this.meetsThreshold();
    return this;
  }

  meetsThreshold(): boolean {
    return this.logLevels.meetsThreshold(this.level, this._threshold);
  }

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._msgParts = [];
    return this;
  }

  setInitialString(...args: (string | number)[]): this {
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
    if (this._enabled) {
      if (isInteger(n)) {
        this.addMsgPart(' '.repeat(n - 1));
      } else if (isNonEmptyString(n)) {
        this.addMsgPart(n);
      }
    }
    return this;
  }

  /**
   * Sets the indentation level of this line of log output..
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    if (this._enabled) {
      this._msgIndent = ' '.repeat(n * this._tabSize - 1);
    }
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
    if (this._enabled && isNonEmptyArray(args)) {
      this.addMsgPart(args.join(' '));
    }
    return this;
  }

  protected appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  stylize(style: StyleFormatterFn | null, ...args: (string | number)[]): this {
    if (this._enabled && isNonEmptyArray(args)) {
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
    if (this._enabled) {
      result = this.formatParts();
      this.clear();
    }
    return result;
  }

  partsAsString(): string {
    return this._msgParts?.map((p) => p.str).join(' ') || '';
  }

  protected formatParts(): string {
    const parts: string[] = [];
    this._msgParts.forEach((part: LogMsgPart) => {
      if (part.style) {
        parts.push(part.style(part.str as unknown as string[]));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }
}
