import { StyleFormatterFn, StyleFormatters } from './types';

export class Style {
  public readonly _styles: StyleFormatters;
  protected _dateFormat: string;

  constructor(styles: StyleFormatters, dateFormat: string = 'YYYY-MM-dd HH:mm:ss') {
    this._dateFormat = dateFormat;
    this._styles = styles;
  }

  get styleNames(): string[] {
    return Object.keys(this._styles) as string[];
  }

  getDefFromName(name: string): StyleFormatterFn {
    return this._styles[name];
  }
}
