import { dateUtil } from '@epdoc/timeutil';
import { Integer } from '@epdoc/typeutil';
import { NextFunction, Request, Response } from 'express';
import { LogManager } from '../log-mgr';
import { LoggerNew } from '../logger';
import { LoggerMiddleware, MiddlewareRouteInfo } from './base';
import { ExpressResponseHooks } from './response-hooks';

// let Response = require('./response');
// let Logger = require('../logger');

let reqId = 0;

export interface LoggerExpressResponse extends Response {
  _origSend: Function;
  _origEnd: Function;
  delayTime: Function;
}

export interface LoggerExpressRequest extends Request {
  _reqId: Integer;
  _hrStartTime: [number, number];
}

/**
 * [Express]{@link http://expressjs.com/} middleware extends express.js
 * [response]{@link http://expressjs.com/en/4x/api.html#res} object by adding a
 * {@link Logger} object via which logging can be done in the context of the request. Also extends
 * [response.send]{@link http://expressjs.com/en/4x/api.html#res.send} and
 * [response.end]{@link http://expressjs.com/en/4x/api.html#res.send} methods to automatically
 * log a message when a response is sent. This message will include the response time for the
 * request.
 *
 * @module middleware/responseLogger
 */

export type ExpressMiddlewareOptions = {
  objName?: string;
  emitter?: string;
  logMgr?: LogManager;
  excludeMethod?: string | string[];
};

export class ExpressMiddleware extends LoggerMiddleware {
  requestId(req: LoggerExpressRequest, res: Response, next: NextFunction) {
    req._reqId = ++reqId;
    req._hrStartTime = process.hrtime();
    next();
  }

  requestLogger(req: Request, res: LoggerExpressResponse, next: NextFunction) {
    let ctx = { req: req, res: res };
    req[this.objName] = new LoggerNew(this.logMgr, this.emitter, ctx);
    res[this.objName] = req[this.objName];

    if (this.excludedMethod(req.method)) {
      res[this.objName].silent = true;
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
  }

  routeLogger(req: LoggerExpressRequest, res: Response, next: NextFunction) {
    if (req[this.objName]) {
      let d: Date = req._startTime || new Date();
      let data: MiddlewareRouteInfo = {
        method: req.method,
        path: req.path,
        protocol: req.protocol,
        //sidNew: ( rawCookie ? false : true ),
        ip: req.ip,
        query: req.query,
        utctime: d.toISOString()
      };
      if (req.session && req.session.id) {
        data.sid = req.session.id;
      }
      if (req.method && req.method.toLowerCase() === 'post') {
        data['content-length'] = req.get('Content-Length');
      }
      res.log.action('routeInfo').data(data)._info();
    }

    next();
  }

  routeSeparator(req: LoggerExpressRequest, res: Response, next: NextFunction) {
    if (req[this.objName]) {
      let d = req._startTime || new Date();
      let data: MiddlewareRouteInfo = {
        method: req.method,
        path: decodeURI(req.path),
        ip: req.ip
      };
      if (req.session) {
        data.sid = req.session.id;
      }
      data.query = req.query;
      data.localtime = dateUtil(d).toISOLocaleString();
      // data.utctime = (d).toISOString();

      super.routeSeparatorForLog(req[this.objName], data);
    }
    next();
  }
}
