import { Dict, isString } from '@epdoc/typeutil';
import { LogMgr, Logger } from '../../core';
import { MiddlewareOptions, MiddlewareRouteInfo, MiddlewareSeparator } from '../types';

/**
 * The common, base class that is subclassed by express and koa to create a
 * framework-specific set of middleware function.
 */
export class LoggerMiddleware {
  _logMgr: LogMgr;
  _emitter: string;
  _objName: string;
  _excludeMethods: any;
  separator: MiddlewareSeparator = {
    length: 22,
    char: '#'
  };

  constructor(options: MiddlewareOptions) {
    this._emitter = options.emitter ?? 'app';
    this._objName = options.objName ?? 'log';
    this._excludeMethods = isString(options.excludeMethod)
      ? [options.excludeMethod]
      : options.excludeMethod;
    this.separator = options.separator;
  }

  setLogMgr(val: LogMgr): this {
    if (val) {
      this._logMgr = val;
    }
    return this;
  }

  get logMgr(): LogMgr {
    return this._logMgr;
  }

  getNewLogger(): Logger {
    return new Logger(this.logMgr);
  }

  protected excludedMethod(method: string): boolean {
    return this._excludeMethods.includes(method.toLowerCase());
  }

  protected logResponse(log: Logger, data: Dict) {}

  protected logRouteInfo(log: Logger, data: MiddlewareRouteInfo) {}

  protected logRouteSeparator(log: Logger, data: MiddlewareRouteInfo) {}
}
