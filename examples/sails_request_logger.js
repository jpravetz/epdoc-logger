'use strict';

/**
 * request-logger hook for sailsjs applications to enable logging of socket requests.
 * This file should be placed in your api/hooks folder
 */

let elogger = require('epdoc-logger');
let middleware = elogger.middleware();
let log = elogger.getLogger('logger');


let fn = {
  reqId: middleware.reqId(),
  responseLogger: middleware.responseLogger({ emitter: 'webApp' }),
  routeSeparator: middleware.routeSeparator({ separator: '-' }),
  sessionLogger: function (req, res, next) {
    if (req.session && req.session.current_user && req.log) {
      req.log.set({ id: req.session.current_user.id, email: req.session.current_user.email });
    }
    next();
  }
};

module.exports = function defineRequestLoggerHook (sails) {

  return {

    initialize: function (done) {
      log.action('socket.hook').info('Initializing custom hook for socket requests');
      return done();
    },

    routes: {
      before: {
        'all /*': {
          skipAssets: true,
          fn: function (req, res, next) {

            //  >> Log your stuff right here <<

            if (req.isSocket) {
              fn.reqId(req, res, function (err) {
                fn.responseLogger(req, res, function (err) {
                  req.log.pushName('socket');
                  fn.sessionLogger(req, res, function (err) {
                    fn.routeSeparator(req, res, next);
                  })
                })
              });
            } else {
              next();
            }
          }
        }
    }
  };

};
