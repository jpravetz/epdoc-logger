/*****************************************************************************
 * app.remove.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/

var epdocLogger = require('../index');

describe.only('logMgr.removeTransport', function () {

    var logMgr = epdocLogger.getLogManager();

    it ('should allow to remove transports', function (done) {
        // 1. add any transport
        logMgr.addTransport('console');

        // 2. try to remove any of these
        logMgr.removeTransport('console', done)
    });
});
