import { LogLevel } from '../../level';
import { LoggerLineFormatOpts, LoggerShowOpts } from '../../types';
import { TransportFormatter } from './base';

export type FormatterType = 'string' | 'json' | 'template' | string;

export type TransportFormatterOpts = {
  show: LoggerShowOpts;
  format: LoggerLineFormatOpts;
  logLevels: LogLevel;
};

export type TransportFormatterFactoryMethod = () => TransportFormatter;

export class TransportFormatterFactory {
  protected _formatters: Record<FormatterType, TransportFormatterFactoryMethod> = {};

  register(name: string, factoryMethod: TransportFormatterFactoryMethod): void {
    this._formatters[name] = factoryMethod;
  }

  getFormatter(name: FormatterType): TransportFormatter {
    let factoryMethod = name ? this._formatters[name] : undefined;
    if (!factoryMethod) {
      throw new Error(`Formatter ${name} not found`);
    }
    return factoryMethod();
  }
}
