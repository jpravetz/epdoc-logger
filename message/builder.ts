import { type Integer, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/typeutil';
import type { LevelName } from '@scope/levels';
import { StringEx } from './util.ts';

const DEFAULT_TAB_SIZE = 2;

export type StyleFormatterFn = (str: string) => string;
export type StyleArg = string | number;

export type LogMsgPart = {
  str: string;
  style?: StyleFormatterFn;
};

export interface ILogEmitter {
  emit(level: LevelName, msg: string): void;
}

export interface IMsgBuilder {
  setLevel(level: LevelName): this;
  setEmitter(emitter: ILogEmitter): this;
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
  protected _level: LevelName;
  protected _emitter: ILogEmitter | undefined;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  // protected _lineFormat: LoggerLineFormatOpts;
  protected _applyColors: boolean = true;

  protected _msgIndent: string = '';
  protected _msgParts: LogMsgPart[] = [];
  protected _suffix: string[] = [];
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;

  constructor(level: LevelName, emitter?: ILogEmitter) {
    this._level = level;
    this._emitter = emitter;
  }

  setLevel(level: LevelName): this {
    this._level = level;
    return this;
  }

  setEmitter(emitter: ILogEmitter): this {
    this._emitter = emitter;
    return this;
  }

  applyColors(): this {
    this._applyColors = true;
    return this;
  }

  noColors(): this {
    this._applyColors = false;
    return this;
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
    if (this._emitter) {
      this._emitter.emit(this._level, result);
    }
    return result;
  }

  partsAsString(): string {
    return this._msgParts?.map((p) => p.str).join(' ') || '';
  }

  protected formatParts(): string {
    const parts: string[] = [];
    this._msgParts.forEach((part: LogMsgPart) => {
      if (part.style && this._applyColors) {
        parts.push(part.style(part.str));
      } else {
        parts.push(part.str);
      }
    });
    return parts.join(' ');
  }
}
