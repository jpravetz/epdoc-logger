import { dateUtil } from '@epdoc/timeutil';
import { isArray, isDate, isDict, isNonEmptyString } from '@epdoc/typeutil';

export type StyleFormatterFn = (text: unknown[]) => string;
export type StyleFormatters = Record<string, StyleFormatterFn>;

export const defaultStyles: StyleFormatters = {} as const;

export type StyleName = keyof typeof defaultStyles;
export type MethodName = Exclude<keyof typeof defaultStyles, `_${string}`>;

export type StyleOptions = {
  dateFormat?: string;
  styles?: Record<string, StyleFormatterFn>;
};

export class Style {
  public readonly _styles: Record<string, StyleFormatterFn>;
  protected _dateFormat: string;

  constructor(options: StyleOptions = { dateFormat: 'YYYY-MM-dd HH:mm:ss' }) {
    this._dateFormat = options.dateFormat;
    if (options.styles) {
      this._styles = Object.assign({}, options.styles);
    }
  }

  get styleNames(): StyleName[] {
    return Object.keys(this._styles) as StyleName[];
  }

  getDefFromName(name: StyleName): StyleFormatterFn {
    return this._styles[name];
  }

  format(val: any, style: StyleName): string {
    const s = this.formatToString(val);
    let styleDef: StyleFormatterFn = isNonEmptyString(style) ? this._styles[style] : undefined;
    if (!styleDef) {
      return s;
    }
    return styleDef(s);
  }

  protected formatToString(val: any): string {
    if (isDict(val) || isArray(val)) {
      return JSON.stringify(val);
    } else if (isDate(val)) {
      return dateUtil(val).format(this._dateFormat);
    }
    return String(val);
  }
}

// // Add this type declaration
// export type StyleInstance = ColorStyle & Record<ColorStyleName, (val: any) => string>;
