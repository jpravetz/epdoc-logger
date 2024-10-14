import type { StyleFormatterFn, StyleFormatters } from '../types.ts';

export interface IStyle {
  getDefFromName(name: string): StyleFormatterFn;
}

export class Style implements IStyle {
  protected _styles: StyleFormatters = {};
  protected _dateFormat: string = 'YYYY-MM-dd HH:mm:ss';

  constructor() {}

  setDateFormat(dateFormat: string): this {
    this._dateFormat = dateFormat;
    return this;
  }

  setStyles(styles: StyleFormatters): this {
    this._styles = styles;
    return this;
  }

  def(name: string): StyleFormatterFn {
    return this._styles[name];
  }

  get styleNames(): string[] {
    return Object.keys(this._styles) as string[];
  }

  getDefFromName(name: string): StyleFormatterFn {
    return this._styles[name];
  }
}
