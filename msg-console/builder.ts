import * as core from '@scope/message';
import * as colors from '@std/fmt/colors';

export const styleFormatters = {
  text: colors.brightWhite,
  h1: (str: string) => colors.bold(colors.magenta(str)),
  h2: colors.magenta,
  h3: colors.green,
  action: (str: string) => colors.black(colors.bgYellow(str)),
  label: colors.blue,
  highlight: colors.brightMagenta,
  value: colors.brightBlue,
  path: colors.blue,
  date: colors.brightCyan,
  warn: colors.brightMagenta,
  error: (str: string) => colors.bold(colors.brightRed(str)),
  strikethru: colors.inverse,
  _reqId: colors.brightYellow,
  _sid: colors.yellow,
  _emitter: colors.green,
  _action: colors.blue,
  _plain: colors.white,
  _suffix: colors.white,
  _elapsed: colors.white,
  _errorPrefix: colors.red,
  _warnPrefix: colors.cyan,
  _infoPrefix: colors.gray,
  _verbosePrefix: colors.gray,
  _debugPrefix: colors.gray,
  _sillyPrefix: colors.gray,
  _httpPrefix: colors.gray,
  _timePrefix: colors.gray,
} as const;

// export class Style extends base.Style {
//   constructor() {
//     super();
//     this.setStyles(styleFormatters);
//   }
// }

// export type StyleName = keyof typeof styleFormatters;

/**
 * Message Builder class for styling messages. Extends the BaseMsgBuilder to
 * provide custom formatting using chained messages. If you prefer to declare
 * and use a custom set of formatting metchods, declare your own MsgBuilder and
 * pass it to the LogManager. s
 */
export class MsgBuilder extends core.MsgBuilder {
  public text(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.text, ...args);
  }
  public h1(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.h1, ...args);
  }
  public h2(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.h2, ...args);
  }
  public h3(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.h3, ...args);
  }
  public action(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.action, ...args);
  }
  public label(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.label, ...args);
  }
  public highlight(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.highlight, ...args);
  }
  public value(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.value, ...args);
  }
  public path(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.path, ...args);
  }
  public date(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.date, ...args);
  }
  public warn(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.warn, ...args);
  }
  public error(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.error, ...args);
  }
  public strikethru(...args: core.StyleArg[]): this {
    return this.stylize(styleFormatters.strikethru, ...args);
  }

  public mark(aMark: string): this {
    performance.mark(aMark);
    return this;
  }

  public elapsed(aMark: string, bMark?: string): this {
    const measure = performance.measure(aMark, bMark);
    if (measure) {
      return this.stylize(styleFormatters._elapsed, measure.duration);
    }
    return this;
  }

  /**
   * Emits the log line with elapsed time. This is a convenience method for
   * emitting the log line with elapsed time without having to call `elapsed()`
   * first.
   * @param { string } aMark - The start mark.
   * @param { string } bMark - The end mark.
   * @returns {string} The log line with elapsed time.
   * @see elapsed()
   */
  emitWithTime(aMark: string, bMark?: string): string {
    return this.ewt(aMark, bMark);
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
  ewt(aMark: string, bMark?: string): string {
    const measure = performance.measure(aMark, bMark);
    if (measure) {
      const description = bMark ? bMark : 'start';
      return this.stylize(
        styleFormatters._elapsed,
        `(${measure.duration.toFixed(3)} ms since ${description})`,
      ).emit();
    }
    return this.emit();
  }
}
