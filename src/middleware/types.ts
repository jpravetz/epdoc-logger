import { Milliseconds } from '@epdoc/timeutil';

export type ParsedUrlQuery = string;

export type MiddlewareRouteInfo = Partial<{
  method: string;
  path: string;
  protocol: string;
  ip: string;
  query: any; // ParsedUrlQuery;
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
  emitter: string;
  objName: string;
  excludeMethod: string | string[];
  separator: MiddlewareSeparator;
}>;
