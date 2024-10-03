/*****************************************************************************
 * app.file.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

let Path = require('path');
const logMgr = require('../src/log_mgr');

describe('Logger file test', function () {
  let token = '4d7f2890-1e74-4b61-9844-ffd8acc62911';
  let log;

  it('Write file as json array', function (done) {
    let opts = {
      transport: {
        type: 'file',
        path: Path.resolve(__dirname, '../log/output_simple.log')
      },
      autoRun: true
    };
    const logMgr = new LogMgr(opts);
    log = logMgr.getLogger('moduleName');
    log.action('bake').info('Starting');
    log.info('Running', { a: 2, b: 3 });
    done();
  });

  it('write file as json', function (done) {
    let opts = {
      transport: {
        type: 'file',
        path: Path.resolve(__dirname, '../log/output_json.log'),
        format: 'json',
        timestamp: 'smstime'
      },
      autoRun: true
    };
    const logMgr = new LogMgr(opts);
    log = logMgr.getLogger('moduleName');
    log.action('bake').info('Starting');
    log.info('Running', { a: 2, b: 3 });
    done();
  });

  it('write file as json array', function (done) {
    let opts = {
      transport: {
        type: 'file',
        path: Path.resolve(__dirname, '../log/output_jsonarray.log'),
        timestamp: 'iso',
        custom: true,
        sid: true
      },
      autoRun: true
    };
    const logMgr = new LogMgr(opts);
    log = logMgr.getLogger('moduleName');
    log.ctx = { req: { reqId: 'reqId', sid: 'sessionId' } };
    log
      .action('bake')
      .set({ static: true })
      .data({ data: { a: 2, b: 3 } })
      .info('Starting');
    log.info('Running');
    done();
  });
});
