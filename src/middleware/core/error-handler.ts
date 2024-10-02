import { LogMgr } from '../../core';

/**
 * Middleware to dump errors to Logger
 * We are catching and logging CSRF exceptions and some JSON parser exceptions.
 * If the exception is not caught, it is allowed to pass through
 */

export default function (logMgr: LogMgr) {
  return function (err, req, res, next) {
    if (doCatch(err)) {
      let params = {
        method: req.route ? req.route.method : undefined,
        path: req.path,
        protocol: req.protocol,
        ip: req.ip,
        params: req.params
      };
      let msg = {
        level: 0,
        reqId: req._reqId,
        sid: req.session ? req.session.id : undefined,
        emitter: 'app',
        action: 'exception',
        data: { error: { status: err.status, message: err.message }, params: params },
        message: err.message
      };
      logMgr.logMessage(msg);
      let errMsg = err.status === 403 ? 'Forbidden. Reloading this page may resolve.' : err.message;
      res.status(err.status).json({ error: { errorId: 'exception', message: errMsg } });
    } else {
      next(err);
    }
  };
}

function doCatch(err) {
  // CSRF exceptions, and some JSON parsing errors
  if (err.status) {
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
