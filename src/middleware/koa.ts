import * as Koa from 'koa';

import { dateUtil, Milliseconds } from '@epdoc/timeutil';
import { LoggerMiddleware, MiddlewareRouteInfo } from './base';

let reqId = 0;

export interface Koa2MiddlewareContext extends Koa.Context {
  _reqId: number;
  state: Koa2MiddlewareState;
}

export interface Koa2MiddlewareState extends Koa.DefaultState {
  hrStartTime: [number, number];
  startTime: Milliseconds;
  _delayTime: Milliseconds;
}

export class Koa2Middleware extends LoggerMiddleware {
  requestId(ctx: Koa2MiddlewareContext, next: Koa.Next): Promise<any> {
    // Add our properties to the Koa context object
    ctx._reqId = ++reqId;
    ctx.state.hrStartTime = process.hrtime();
    ctx.state.startTime = new Date().getTime();

    return next().then(() => {
      const ms = new Date().getTime() - ctx.state.startTime;
      ctx.set('X-Response-Time', `${ms}ms`);
    });
  }

  requestLogger(ctx: Koa2MiddlewareContext, next: Koa.Next): Promise<any> {
    // Add our method to the Koa context object
    let log = this.logMgr.getLogger(this.emitter, ctx);
    ctx[this.objName] = log;

    if (this.excludedMethod(ctx.req.method)) {
      log._silent = true;
    } else {
      ctx.delayTime = function () {
        return ctx.state._delayTime;
      };
    }

    return next().then(() => {
      log.data({ status: ctx.res.status }).hrElapsed('responseTime');
      if (ctx.state.delayTime) {
        log.data('delay', ctx.state.delayTime);
      }
      // If you want to log more properties you can add them to res._logSendData
      if (ctx.state.logSendData) {
        Object.keys(ctx.state.logSendData).forEach((key) => {
          log.data(key, ctx.state.logSendData[key]);
        });
      }
      log.action('response.send')._info();
      return Promise.resolve();
    });
  }

  routeInfo(ctx: Koa2MiddlewareContext, next: Koa.Next) {
    //let rawCookie = req.cookies['connect.sid'];

    if (ctx.log) {
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
      ctx.log.action('routeInfo').data(data)._info();
    }

    return next();
  }

  routeSeparator(ctx: Koa2MiddlewareContext, next: Koa.Next) {
    if (ctx.log) {
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

      super.routeSeparatorForLog(ctx.log, data);
    }

    return next();
  }
}
