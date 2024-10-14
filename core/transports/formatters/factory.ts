import * as core from '../../lib/index.ts';
import type { TransportFormatter } from './base.ts';

export type TransportFormatterOpts = {
  logMgr: core.LogMgr;
  show: core.LoggerShowOpts;
  format: core.MsgBuilderFormatOpts;
  // style: Style;
};

export type TransportFormatterFactoryMethod = (logMgr: core.LogMgr) => TransportFormatter;

export function getNewTransportFormatterFactory(
  logMgr: core.LogMgr,
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
  protected _logMgr: core.LogMgr;
  protected _formatters: Record<core.FormatterType, TransportFormatterFactoryMethod> = {};

  constructor(logMgr: core.LogMgr) {
    this._logMgr = logMgr;
  }

  register(name: core.FormatterType, factoryMethod?: TransportFormatterFactoryMethod): Promise<void> {
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

  getFormatter(name: core.FormatterType): TransportFormatter {
    let factoryMethod: TransportFormatterFactoryMethod | undefined = name
      ? this._formatters[name]
      : undefined;
    if (!factoryMethod) {
      throw new Error(`Formatter ${name} not found`);
    }
    return factoryMethod(this._logMgr);
  }
}
