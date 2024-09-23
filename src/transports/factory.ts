import { TransportOptions } from '../types';
import { LogTransport } from './base';
// import { getNewBufferTransport } from './buffer';
// import { getNewConsoleTransport } from './console';
// import { getNewFileTransport } from './file';

export type TransportType = 'console' | 'buffer' | 'file' | string;

export type TransportFactoryMethod = (options: TransportOptions) => LogTransport;

export class TransportFactory {
  protected _transports: Record<TransportType, TransportFactoryMethod> = {
    // console: getNewConsoleTransport,
    // file: getNewFileTransport,
    // buffer: getNewBufferTransport
  };

  register(name: string, factoryMethod: TransportFactoryMethod): void {
    this._transports[name] = factoryMethod;
  }

  getTransport(options: TransportOptions = {}): LogTransport {
    let factory = options.name ? this._transports[options.name] : undefined;
    if (!factory) {
      throw new Error(`Transport ${options.name} not found`);
    }
    return factory(options);
  }
}
