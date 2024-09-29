/*****************************************************************************
 * app.loggly.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

let elogger = require('../index');
let should = require('should');

describe('Console', function () {
  describe('Function callback', function () {
    it('Pass', function (done) {
      let idx = 0;
      let actions = ['logger.transport.add', 'logger.start.success', 'bake', '4'];
      let opts = {
        transports: ['console'],
        console: {
          format: function (params, opts) {
            try {
              let s = 'Output string #' + idx;
              should(params).have.property('action', actions[idx]);
              ++idx;
              return s;
            } catch (err) {
              console.error(err);
            }
          }
        }
      };
      let logMgr = new elogger.LogManager(opts).start();
      let log = logMgr.getLogger('app.console.start');
      log.action('bake').info('Starting');
      log.data({ c: 4, e: 7 }).action('4').debug('Running', { a: 2, b: 3 });
      done();
    });
  });

  describe('String format VISUAL', function () {
    it('Pass', function (done) {
      let idx = 0;
      let actions = ['logger.transport.add', 'logger.start.success', 'bake', '4'];
      let opts = {
        transports: ['console'],
        level: 'verbose',
        console: {
          format: 'template',
          colorize: true
        }
      };
      let logMgr = new elogger.LogManager(opts).start();
      let log = logMgr.getLogger('app.console.start');
      log.action('bake').info('This should be green text');
      log.action('verbose').verbose('This should be cyan text');
      log.action('warn').warn('This should be yellow text');
      log.action('test').error('Message and levels text should be red');
      log.data({ c: 4, e: 7 }).action('4').debug('This should be blue text', { a: 2, b: 3 });
      done();
    });
  });

  describe('Custom format VISUAL', function () {
    it('Pass', function (done) {
      let idx = 0;
      let actions = ['logger.transport.add', 'logger.start.success', 'bake', '4'];
      let opts = {
        transports: ['console'],
        console: {
          format: 'template',
          colorize: true,
          template: '${action} ${ts} $c015{message} $c{level}'
        }
      };
      let logMgr = new elogger.LogManager(opts).start();
      let log = logMgr.getLogger('app.console.start');
      log.action('bake').info('Green leftpad');
      log.action('test').error('Red leftpad');
      log.data({ c: 4, e: 7 }).action('4').debug('Blue', { a: 2, b: 3 });
      done();
    });
  });
});
