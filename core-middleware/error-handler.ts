import type { LogMgr } from '../../core/index.ts';

/**
 * Middleware to dump errors to Logger
 * We are catching and logging CSRF exceptions and some JSON parser exceptions.
 * If the exception is not caught, it is allowed to pass through
 */

export default function (logMgr: LogMgr) {
  return function (err, req, res, next) {
    if (doCatch(err)) {
      const params = {
        method: req.route ? req.route.method : undefined,
        path: req.path,
        protocol: req.protocol,
        ip: req.ip,
        params: req.params,
      };
      const msg = {
        level: 0,
        reqId: req._reqId,
        sid: req.session ? req.session.id : undefined,
        emitter: 'app',
        action: 'exception',
        data: { error: { status: err.status, message: err.message }, params: params },
        message: err.message,
      };
      logMgr.logMessage(msg);
      const errMsg = err.status === 403 ? 'Forbidden. Reloading this page may resolve.' : err.message;
      res.status(err.status).json({ error: { errorId: 'exception', message: errMsg } });
    } else {
      next(err);
    }
  };
}

function doCatch(err: unknown) {
  // CSRF exceptions, and some JSON parsing errors
  if (err && typeof err === 'object' && 'status' in err) {
    if (err.status == 403) {
      return true;
    }
    if (err.status == 400) {
      if (err.message === 'invalid json' || err.message == 'Request aborted') {
        return true;
      }
    }
  }
  // JSON parser
  if (err instanceof SyntaxError) {
    return true;
  }
  return false;
}
