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

export function getNewTransportFormatterFactory(
  ...args: string[]
): Promise<TransportFormatterFactory> {
  const factory: TransportFormatterFactory = new TransportFormatterFactory();
  const jobs: Promise<void>[] = [];
  args.forEach((name) => {
    jobs.push(factory.register(name));
  });
  return Promise.all(jobs).then(() => factory);
}

export class TransportFormatterFactory {
  protected _formatters: Record<FormatterType, TransportFormatterFactoryMethod> = {};

  register(name: FormatterType, factoryMethod?: TransportFormatterFactoryMethod): Promise<void> {
    if (factoryMethod) {
      this._formatters[name] = factoryMethod;
    } else {
      return import(`./${name}`).then((mod) => {
        this._formatters[name] = mod.getNewFormatter;
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  }

  getFormatter(name: FormatterType): TransportFormatter {
    let factoryMethod = name ? this._formatters[name] : undefined;
    if (!factoryMethod) {
      throw new Error(`Formatter ${name} not found`);
    }
    return factoryMethod();
  }
}
