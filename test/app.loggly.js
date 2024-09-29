/*****************************************************************************
 * app.loggly.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

let epdocLogger = require('../index');
let should = require('should');

describe.skip('Loggly test', function () {
  let logMgr;
  let log;
  let token = '4d7f2890-1e74-4b61-9844-ffd8acc62911';

  it('Logger console', function (done) {
    logMgr = epdocLogger.getLogManager();
    log = epdocLogger.getLogger('moduleName');
    log.action('bake').info('Starting');
    log.data({ c: 4, e: 7 }).debug('Running', { a: 2, b: 3 });
    done();
  });

  it('Logger console2', function (done) {
    log = Logger.get('module2');
    log.info('Doing more');
    log.action('slide').info('end');
    done();
  });

  it('Logger loggly', function (done) {
    let opts = {
      token: token
    };
    let logMgr = Logger.getLogManager();
    logMgr.setTransport('loggly', opts);
    log = logMgr.getLogger('module3');
    log.info('Doing even more');
    log.action('myaction').info('end');
    logMgr.writeCount();
    logMgr.destroying().then(
      function () {
        done();
      },
      function (err) {
        done(err);
      }
    );
  });
});
