/*****************************************************************************
 * app.loggly.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var elogger = require('../index');
var should = require('should');

describe("Console", function () {

    describe('Function callback',function() {
        it("Pass", function (done) {
            var idx = 0;
            var actions = ['logger.transport.add','logger.start.success','bake','4'];
            var opts = {
                transports: [ 'console' ],
                console: {
                    format: function(params,opts) {
                        try {
                            var s = "Output string #" + idx;
                            should(params).have.property('action',actions[idx]);
                            ++idx;
                            return s;
                        } catch(err) {
                            console.error(err);
                        }
                    }
                }
            };
            var logMgr = new elogger.LogManager(opts).start();
            var log = logMgr.getLogger('app.console.start');
            log.action('bake').info("Starting");
            log.data({c:4,e:7}).action('4').debug("Running",{a:2,b:3});
            done();
        });
    });

    describe('String format VISUAL',function() {
        it("Pass", function (done) {
            var idx = 0;
            var actions = ['logger.transport.add','logger.start.success','bake','4'];
            var opts = {
                transports: [ 'console' ],
                console: {
                    format: 'template',
                    colorize: true
                }
            };
            var logMgr = new elogger.LogManager(opts).start();
            var log = logMgr.getLogger('app.console.start');
            log.action('bake').info("Starting");
            log.action('warn').warn("Warn here");
            log.action('test').error("Starting");
            log.data({c:4,e:7}).action('4').debug("Running",{a:2,b:3});
            done();
        });
    });

    describe('Custom format VISUAL',function() {
        it("Pass", function (done) {
            var idx = 0;
            var actions = ['logger.transport.add','logger.start.success','bake','4'];
            var opts = {
                transports: [ 'console' ],
                console: {
                    format: 'template',
                    colorize: true,
                    template: '%{action} %{ts} %{message} %{level}'
                }
            };
            var logMgr = new elogger.LogManager(opts).start();
            var log = logMgr.getLogger('app.console.start');
            log.action('bake').info("Starting");
            log.action('test').error("Starting");
            log.data({c:4,e:7}).action('4').debug("Running",{a:2,b:3});
            done();
        });
    });



});
