/*****************************************************************************
 * app.remove.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/

let epdocLogger = require('../index');

describe('logMgr.removeTransport', function () {
  let logMgr = epdocLogger.getLogManager();

  it('should allow to remove transports', function (done) {
    // 1. add any transport
    logMgr.addTransport('console');

    // 2. try to remove any of these
    logMgr.removeTransport('console', done);
  });
});
