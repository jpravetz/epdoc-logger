import { dateUtil } from '@epdoc/timeutil';
import type { NextFunction, Request, Response } from 'express';
import { hrtime } from 'node:process';
import type { Logger } from '../../core/index.ts';
import { LoggerMiddleware } from '../core/base.ts';
import { ExpressResponseHooks } from '../core/response-hooks.ts';
import type { MiddlewareRouteInfo } from '../types.ts';
import type * as Express from './types.ts';

export * from '../types.ts';
export * from './types.ts';

// let Response = require('./response');
// let Logger = require('../logger');

export type RequestLoggerFn = (req: Request, res: Express.LoggerResponse, next: NextFunction) => void;

let reqId = 0;

/**
 * Express middleware that uses the core or base versions of LogMgr and Logger.
 */
export class Middleware extends LoggerMiddleware {
  getReqIdFn(): RequestLoggerFn {
    const reqIdFn = (req: Express.LoggerRequest, res: Response, next: NextFunction) => {
      req._reqId = ++reqId;
      req._hrStartTime = hrtime.bigint();
      req._startTime = new Date();
      next();
    };
    return reqIdFn;
  }

  getRequestLoggerFn(): RequestLoggerFn {
    const requestLogger = (req: Request, res: Express.LoggerResponse, next: NextFunction) => {
      const ctx = { req: req, res: res };
      req[this._objName] = this.getNewLogger().emitter(this._emitter).context(ctx);
      res[this._objName] = req[this._objName];

      if (this.excludedMethod(req.method)) {
        res[this._objName].silent = true;
      } else {
        // We need the super's send method because we're going to muck with it
        res._origSend = res.send;
        res.send = ExpressResponseHooks.send;

        // We need the super's send method
        res._origEnd = res.end;
        res.end = ExpressResponseHooks.end;

        res.delayTime = ExpressResponseHooks.delayTime;
      }

      next();
    };
    return requestLogger;
  }

  getLogger(req: Express.LoggerRequest): Logger {
    return req[this._objName];
  }

  getRouteLoggerFn(): RequestLoggerFn {
    const routeLogger = (req: Express.LoggerRequest, res: Response, next: NextFunction) => {
      let log = this.getLogger(req);
      if (log) {
        let d: Date = req._startTime || new Date();
        let data: MiddlewareRouteInfo = {
          method: req.method,
          path: req.path,
          protocol: req.protocol,
          //sidNew: ( rawCookie ? false : true ),
          ip: req.ip,
          query: req.query,
          utctime: d.toISOString(),
        };
        if (req.session && req.session.id) {
          data.sid = req.session.id;
        }
        if (req.method && req.method.toLowerCase() === 'post') {
          data['content-length'] = req.get('Content-Length');
        }
        super.logRouteInfo(log, data);
      }

      next();
    };
    return routeLogger;
  }

  getRouteSeparatorFn(): RequestLoggerFn {
    const routeSeparator = (req: Express.LoggerRequest, res: Response, next: NextFunction) => {
      const log: Logger = this.getLogger(req);
      if (log) {
        let d = req._startTime || new Date();
        let data: MiddlewareRouteInfo = {
          method: req.method,
          path: decodeURI(req.path),
          ip: req.ip,
        };
        if (req.session) {
          data.sid = req.session.id;
        }
        data.query = req.query;
        data.localtime = dateUtil(d).toISOLocaleString();
        // data.utctime = (d).toISOString();

        super.logRouteSeparator(log, data);
      }
      next();
    };
    return routeSeparator;
  }
}
