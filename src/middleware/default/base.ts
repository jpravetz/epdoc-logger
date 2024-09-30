import { Dict } from '@epdoc/typeutil';
import { Logger } from '../../default';
import * as original from '../core/base';
import { MiddlewareRouteInfo } from '../types';

export class LoggerMiddleware extends original.LoggerMiddleware {
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
