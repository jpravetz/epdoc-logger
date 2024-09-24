import { Milliseconds } from '@epdoc/timeutil';
import { isString } from '@epdoc/typeutil';
import { isNonEmptyString } from 'epdoc-util';
import { ParsedUrlQuery } from 'querystring';
import { LogManager } from '../log-mgr';
import { LoggerNew } from '../logger';

export type MiddlewareRouteInfo = Partial<{
  method: string;
  path: string;
  protocol: string;
  ip: string;
  query: ParsedUrlQuery;
  utctime: string;
  sid: string;
  localtime: string;
}>;

export type MiddlewareState = Partial<{
  hrStartTime: [number, number];
  startTime: Milliseconds;
  _delayTime: Milliseconds;
}>;

export type MiddlewareContext = Partial<{
  reqId: number;
  state: any;
}>;

export type MiddlewareSeparator = Partial<{
  length: number;
  char: string;
}>;

export type MiddlewareOptions = Partial<{
  logMgr: LogManager;
  emitter: string;
  objName: string;
  excludeMethod: string | string[];
  separator: MiddlewareSeparator;
}>;

export class LoggerMiddleware {
  logMgr: LogManager;
  emitter: string;
  objName: string;
  excludeMethods: any;
  separator: MiddlewareSeparator = {
    length: 22,
    char: '#'
  };

  constructor(options: MiddlewareOptions) {
    this.logMgr = options.logMgr;
    this.emitter = options.emitter ?? 'app';
    this.objName = options.objName ?? 'log';
    this.excludeMethods = isString(options.excludeMethod)
      ? [options.excludeMethod]
      : options.excludeMethod;
    this.separator = options.separator;
  }

  protected excludedMethod(method: string): boolean {
    return this.excludeMethods.includes(method.toLowerCase());
  }

  protected routeSeparatorForLog(log: LoggerNew, data: MiddlewareRouteInfo) {
    let sep = log._logMgr?.sep ?? { str: '#', len: 80 };
    sep.str = isNonEmptyString(sep.str) ? sep.str : '#';
    const sepLen = ((sep.len - data.path.length - 2) / 2) * sep.str.length;
    const sepLenLeft = Math.ceil((sep.len - data.path.length) / 2);

    log
      .action(data.method)
      .data(data)
      ._info(
        [sep.str.repeat(Math.ceil(sepLen)), data.path, sep.str.repeat(Math.floor(sepLen))].join(' ')
      );
  }
}
