import { Dict } from '@epdoc/typeutil';
import { Logger } from '../../default';
import { MiddlewareRouteInfo } from '../types';
import * as base from './base';

/**
 * Class subclasses the base LoggerMiddleware, but is configured to use the
 * default LogMgr and Logger rather than the base or core versions of these
 * classes.
 */

export class LoggerMiddleware extends base.LoggerMiddleware {
  getNewLogger(): Logger {
    return new Logger(this.logMgr);
  }
  protected logResponse(log: Logger, data: Dict) {
    log.info().action('response.send').data(data).emit();
    // log.hrElapsed('responseTime').emit();
  }

  protected logRouteInfo(log: Logger, data: MiddlewareRouteInfo) {
    log.info().action('routeInfo').data(data).emit();
  }
  protected logRouteSeparator(log: Logger, data: MiddlewareRouteInfo) {
    log.info().path(data.path.length).separator().action(data.method).emit();
  }
}
