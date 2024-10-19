import type { Dict } from '@epdoc/typeutil';
import { Logger } from '../../default/index.ts';
import type { MiddlewareRouteInfo } from '../types.ts';
import * as base from './base.ts';

/**
 * Class subclasses the base LoggerMiddleware, but is configured to use the
 * default LogMgr and Logger rather than the base or core versions of these
 * classes.
 */

export class LoggerMiddleware extends base.LoggerMiddleware {
  override getNewLogger(): Logger {
    return new Logger(this.logMgr);
  }
  override logResponse(log: Logger, data: Dict) {
    log.info().action('response.send').data(data).emit();
    // log.hrElapsed('responseTime').emit();
  }

  override logRouteInfo(log: Logger, data: MiddlewareRouteInfo) {
    log.info().action('routeInfo').data(data).emit();
  }
  override logRouteSeparator(log: Logger, data: MiddlewareRouteInfo) {
    log
      .info()
      .path(data.path?.length ?? 0)
      .separator()
      .action(data.method)
      .emit();
  }
}
