import * as Koa from 'koa';

import { dateUtil } from '@epdoc/timeutil';
import { Dict } from '@epdoc/typeutil';
import { Logger } from '../../core';
import { LoggerMiddleware } from '../core/base';
import { MiddlewareRouteInfo } from '../types';
import * as Koa2 from './types';

let reqId = 0;

export class Middleware extends LoggerMiddleware {
  requestId(ctx: Koa2.Context, next: Koa.Next): Promise<any> {
    // Add our properties to the Koa context object
    ctx._reqId = ++reqId;
    ctx.state.hrStartTime = process.hrtime();
    ctx.state.startTime = new Date().getTime();

    return next().then(() => {
      const ms = new Date().getTime() - ctx.state.startTime;
      ctx.set('X-Response-Time', `${ms}ms`);
    });
  }

  requestLogger(ctx: Koa2.Context, next: Koa.Next): Promise<any> {
    // Add our method to the Koa context object
    let log = this.getNewLogger().emitter(this._emitter).context(ctx);

    ctx[this._objName] = log;

    if (this.excludedMethod(ctx.req.method)) {
      log.silent = true;
    } else {
      ctx.delayTime = function () {
        return ctx.state._delayTime;
      };
    }

    return next().then(() => {
      // @ts-ignore
      const data: Dict = { status: ctx.res.status };
      if (ctx.state.delayTime) {
        data.delay, ctx.state.delayTime;
      }
      // If you want to log more properties you can add them to res._logSendData
      if (ctx.state.logSendData) {
        Object.keys(ctx.state.logSendData).forEach((key) => {
          data[key] = ctx.state.logSendData[key];
        });
      }
      super.logResponse(log, data);
      return Promise.resolve();
    });
  }

  getLogger(ctx: Koa2.Context): Logger {
    return ctx[this._objName];
  }

  routeInfo(ctx: Koa2.Context, next: Koa.Next) {
    //let rawCookie = req.cookies['connect.sid'];
    const log = this.getLogger(ctx);
    if (log && !log.silent) {
      let d: Date = ctx.state.startTime || ctx._startTime || new Date();
      let data: MiddlewareRouteInfo = {
        method: ctx.method,
        path: ctx.path,
        protocol: ctx.protocol,
        //sidNew: ( rawCookie ? false : true ),
        ip: ctx.ip,
        query: ctx.query,
        utctime: new Date(d).toISOString()
      };
      if (ctx.session && ctx.session.id) {
        data.sid = ctx.session.id;
      }
      if (ctx.method && ctx.method.toLowerCase() === 'post') {
        data['content-length'] = ctx.length;
      }
      super.logRouteInfo(log, data);
    }

    return next();
  }

  routeSeparator(ctx: Koa2.Context, next: Koa.Next) {
    const log = this.getLogger(ctx);
    if (log && !log.silent) {
      let d = ctx.state.startTime || ctx._startTime || new Date();
      let data: MiddlewareRouteInfo = {
        method: ctx.method,
        path: decodeURI(ctx.path),
        ip: ctx.ip
      };
      if (ctx.session) {
        data.sid = ctx.session.id;
      }
      data.query = ctx.query;
      data.localtime = dateUtil(d).toISOLocaleString();
      // data.utctime = (d).toISOString();

      super.logRouteSeparator(log, data);
    }

    return next();
  }
}
