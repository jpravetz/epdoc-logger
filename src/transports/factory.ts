import { TransportOptions } from '../types';
import { LogTransport } from './base';
// import { getNewBufferTransport } from './buffer';
// import { getNewConsoleTransport } from './console';
// import { getNewFileTransport } from './file';

export type TransportType = 'console' | 'buffer' | 'file' | string;

export type TransportFactoryMethod = (options: TransportOptions) => LogTransport;

export function getNewTransportFactory(...args: string[]): Promise<TransportFactory> {
  const factory: TransportFactory = new TransportFactory();
  const jobs: Promise<void>[] = [];
  args.forEach((name) => {
    jobs.push(factory.register(name));
  });
  return Promise.all(jobs).then(() => factory);
}

export class TransportFactory {
  protected _transports: Record<TransportType, TransportFactoryMethod> = {
    // console: getNewConsoleTransport,
    // file: getNewFileTransport,
    // buffer: getNewBufferTransport
  };

  register(name: TransportType, factoryMethod?: TransportFactoryMethod): Promise<void> {
    if (factoryMethod) {
      this._transports[name] = factoryMethod;
    } else {
      return import(`./${name}`).then((mod) => {
        this._transports[name] = mod.getNewTransport;
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  }

  getTransport(options: TransportOptions = {}): LogTransport {
    let factory = options.name ? this._transports[options.name] : undefined;
    if (!factory) {
      throw new Error(`Transport ${options.name} not found`);
    }
    return factory(options);
  }
}
