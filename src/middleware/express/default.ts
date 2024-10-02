import * as expressBase from './base';

export * from '../types';
export * from './types';

// import * as express from './core/express';
// export { express };

/**
 * Class subclasses the express LoggerMiddleware, but is configured to use the
 * default LogMgr and Logger rather than the base or core versions of these
 * classes.
 *
 * A reminder that the default LogMgr and Logger are configured with a default
 * set of log levels and style methods, whereas the base versions do not have
 * these additional methods.
 */

export class Middleware extends expressBase.Middleware {}
