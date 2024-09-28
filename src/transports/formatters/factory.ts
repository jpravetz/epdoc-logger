import { LogManager } from '../../log-manager';
import { Style } from '../../style';
import { LoggerLineFormatOpts, LoggerShowOpts } from '../../types';
import { TransportFormatter } from './base';

export type FormatterType = 'string' | 'json' | 'json-array' | string;

export type TransportFormatterOpts = {
  logMgr: LogManager;
  show: LoggerShowOpts;
  format: LoggerLineFormatOpts;
  style: Style;
};

export type TransportFormatterFactoryMethod = (logMgr: LogManager) => TransportFormatter;

export function getNewTransportFormatterFactory(
  logMgr: LogManager,
  ...args: string[]
): Promise<TransportFormatterFactory> {
  const factory: TransportFormatterFactory = new TransportFormatterFactory(logMgr);
  const jobs: Promise<void>[] = [];
  args.forEach((name) => {
    jobs.push(factory.register(name));
  });
  return Promise.all(jobs).then(() => factory);
}

export class TransportFormatterFactory {
  protected _logMgr: LogManager;
  protected _formatters: Record<FormatterType, TransportFormatterFactoryMethod> = {};

  constructor(logMgr: LogManager) {
    this._logMgr = logMgr;
  }

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
    let factoryMethod: TransportFormatterFactoryMethod = name ? this._formatters[name] : undefined;
    if (!factoryMethod) {
      throw new Error(`Formatter ${name} not found`);
    }
    return factoryMethod(this._logMgr);
  }
}
