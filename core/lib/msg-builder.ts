import {
  type Integer,
  isDefined,
  isDict,
  isInteger,
  isNonEmptyArray,
  isNonEmptyString,
  isNumber,
  isString,
  pick,
} from '@epdoc/typeutil';
import { Logger, LogMgr } from '../mod.ts';
import type { AppTimer } from './app_timer.ts';
import type { LogLevel, LogLevels, LogLevelValue } from './levels.ts';
import type {
  LogContextParams,
  LoggerShowOpts,
  LogMessage,
  LogMsgPart,
  SeparatorOpts,
  StyleFormatterFn,
} from './types.ts';
import { StringEx } from './util.ts';

const DEFAULT_TAB_SIZE = 2;

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class MsgBuilder {
  protected _logMgr: LogMgr;
  protected _showOpts: LoggerShowOpts;
  protected _tabSize: Integer = DEFAULT_TAB_SIZE;
  // protected _lineFormat: LoggerLineFormatOpts;
  protected _separatorOpts: SeparatorOpts;

  protected _enabled: boolean = false;
  protected _msgIndent: string = '';
  protected _msgParts: LogMsgPart[] = [];
  protected _suffix: string[] = [];
  protected _timer: AppTimer;
  // protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;
  protected _msg: LogMessage = {};
  // protected _emitter: string;
  // protected _action: string;
  protected _data: Record<string, unknown> = {};

  constructor(logMgr: LogMgr, msg: LogMessage) {
    this._logMgr = logMgr;
    this._msg = msg ?? {};
  }

  logManager(val: LogMgr): this {
    if (val instanceof LogMgr) {
      this._logMgr = val;
    }
    return this;
  }

  logMessage(val: LogMessage): this {
    if (val) {
      this._msg = val;
    }
    return this;
  }

  contextParams(val: LogContextParams): this {
    this._msg = Object.assign(this._msg, val);
    return this;
  }

  protected get logMgr(): LogMgr {
    return this._logMgr;
  }

  protected get logLevels(): LogLevels {
    return this._logMgr.logLevels;
  }

  get level(): LogLevelValue {
    return this._msg.level ?? 9;
  }

  setLevel(val: LogLevel): this {
    this._msg.level = this.logMgr.levelAsValue(val);
    this._enabled = this.meetsThreshold();
    return this;
  }

  meetsThreshold(): boolean {
    return this.logLevels.meetsThreshold(this.level);
  }

  /**
   * Add the emitter for this line of output. The emitter can be a class name,
   * module name, or other identifier. Use is entirely optional.
   * @param {string} name - The emitter name.
   * @returns {this} The LoggerLine instance.
   */
  emitter(name: string): this {
    this._msg.emitter = name;
    return this;
  }

  /**
   * Add the action for this line of output. The action is usually a verb for
   * what this line is doing. Use is entirely optional.
   * @param {string} name - The action name.
   * @returns {this} The LoggerLine instance.
   */
  action(...args: string[]) {
    this._msg.action = args.join('.');
    return this;
  }

  /**
   * Set a property or multiple properties in the <code>data</code> column.
   * @example
   * log.info().data('a',3).data('b',4).emit();
   * log.info().data({a:3,b:4}).emit();
   *
   * @param {string|object} key - If a string then sets <code>data[key]</code> to
   *   <code>value</code>. Otherwise extend the object <code>data</code> with the object
   *   <code>key</code>.
   * @param [value] {string} If key is a string then sets <code>data[key]</code> to this value.
   * @return {Logger}
   */
  data(key: string | unknown, value?: unknown): this {
    return this._setData(key, value);
  }

  /**
   * Common method used by the {@link Logger#data} method.
   * @param field
   * @param key
   * @param value
   * @returns {Logger}
   * @private
   */
  _setData(key: string | unknown, value?: unknown): this {
    if ((isString(key) || isNumber(key)) && isDefined(value)) {
      if (!this._msg.data) {
        this._msg.data = {};
      }
      this._msg.data[key] = value;
    } else if (isDict(key) && isDict(this._msg.data)) {
      this._msg.data = Object.assign(this._msg.data, key);
    }
    return this;
  }

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._msg = pick(this._msg, 'reqId', 'sid');
    this._msg.parts = [];
    return this;
  }

  setInitialString(...args: unknown[]): this {
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

  stylize(style: StyleFormatterFn | null, ...args): this {
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

  /**
   * Emits the log line with elapsed time. This is a convenience method for
   * emitting the log line with elapsed time without having to call `elapsed()`
   * first.
   * @param { unknown[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   */
  emitWithTime(...args: unknown[]): void {
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
  ewt(...args: unknown[]): void {
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
  emit(...args: unknown[]): void {
    if (this._enabled) {
      this._logMgr.logMessage(this._msg);
      this.clear();
    }
  }

  /**
   * Creates a separator for the log line. Any other data added to the line will
   * be ignored. Must still call emit() to actually emit the log line.
   * @returns {this} The Logger instance.
   * @see Logger#separator
   */
  separator(): this {
    if (this._enabled) {
      this._msg.separator = true;
    }
    return this;
  }
  partsAsString(): string {
    return this._msg.parts?.map((p) => p.str).join(' ') || '';
  }
}
