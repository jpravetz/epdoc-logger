/*****************************************************************************
 * app.lifecycle.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var epdocLogger = require('../index');
var should = require('should');

describe("Logger lifecycle", function () {

    var logMgr;
    var log;
    var token = '4d7f2890-1e74-4b61-9844-ffd8acc62911';

    it("Init LogManager and Logger", function (done) {
        logMgr = new epdocLogger.LogManager();
        log = logMgr.get('moduleName');
        log.action('bake').info("Starting");
        log.data({ c: 4, e: 7 }).debug("Running", { a: 2, b: 3 });
        done();
    });

    var buffer = [[], [], []];

    function onMessage (params) {
        buffer[1].push(params);
    }

    function onMessage2 (params) {
        buffer[2].push(params);
    }

    it("Set Callback transport and verify previous messages", function (done) {
        logMgr.addTransport('callback', { callback: onMessage, uid: 1 }).start(function () {
            try {
                var params = buffer[1].shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'bake',
                    message: 'Starting',
                    emitter: 'moduleName',
                    level: 'info'
                });
                params = buffer[1].shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    message: 'Running { a: 2, b: 3 }',
                    emitter: 'moduleName',
                    level: 'debug'
                });
                should.not.exist(params.action);
                should(params.data).have.properties({ c: 4, e: 7 });
                params = buffer[1].shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'logger.transport.add',
                    message: "Added transport 'Callback (1)'",
                    emitter: 'logger',
                    level: 'info'
                });
                should(params.data).have.properties({ transport: 'Callback (1)' });
                params = buffer[1].shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'logger.start.success',
                    message: "Started transport 'Callback (1)'",
                    emitter: 'logger',
                    level: 'info'
                });
                should(params.data).have.properties({ transport: 'Callback (1)' });
                params = buffer[1].shift();
                should.not.exist(params);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("Verify new messages", function (done) {
        log = logMgr.get('module2');
        log.info("Doing more");
        params = buffer[1].shift();
        should(params).have.property('timestamp');
        should(params).have.properties({ message: 'Doing more', emitter: 'module2', level: 'info' });
        should.not.exist(params.action);
        log.action('slide').warn("end");
        var params = buffer[1].shift();
        should(params).have.property('timestamp');
        should(params).have.properties({
            action: 'slide',
            message: 'end',
            emitter: 'module2',
            level: 'warn'
        });
        params = buffer[1].shift();
        params = buffer[1].shift();
        should.not.exist(params);
        done();
    });

    it("Add another transport", function (done) {
        logMgr.addTransport('callback', { callback: onMessage2, uid: 2 }).start(function () {
            try {
                _.each([1, 2], function (n) {
                    var params = buffer[n].shift();
                    should(params).have.property('timestamp');
                    should(params).have.properties({
                        action: 'logger.transport.add',
                        message: "Added transport 'Callback (2)'",
                        emitter: 'logger',
                        level: 'info'
                    });
                    should(params.data).have.properties({ transport: 'Callback (2)' });
                    params = buffer[n].shift();
                    should(params).have.property('timestamp');
                    should(params).have.properties({
                        action: 'logger.start.success',
                        message: "Started transport 'Callback (2)'",
                        emitter: 'logger',
                        level: 'info'
                    });
                    should(params.data).have.properties({ transport: 'Callback (2)' });
                    params = buffer[n].shift();
                    should(params).have.property('timestamp');
                    should(params).have.properties({
                        action: 'logger.start.success',
                        message: "Started transport 'Callback (1)'",
                        emitter: 'logger',
                        level: 'info'
                    });
                    should(params.data).have.properties({ transport: 'Callback (1)' });
                    params = buffer[n].shift();
                    should.not.exist(params);
                });
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it("Verify new messages 2", function (done) {
        log.info("Doing even more");
        _.each([1, 2], function (n) {
            var params = buffer[n].shift();
            should(params).have.property('timestamp');
            should(params).have.properties({
                message: 'Doing even more',
                emitter: 'module2',
                level: 'info'
            });
            should.not.exist(params.action);
            params = buffer[n].shift();
            should.not.exist(params);
        })
        done();
    });


    it("Verify removing transport", function (done) {
        logMgr.removeTransport({type:'callback',uid:1});
        var params = buffer[2].shift();
        should.not.exist(params);
        logMgr.start(function() {
            try {
                params = buffer[2].shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    message: "Removed transport 'Callback (1)'",
                    action: 'logger.transport.remove',
                    emitter: 'logger',
                    level: 'info'
                });
                params = buffer[2].shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'logger.start.success',
                    message: "Started transport 'Callback (2)'",
                    emitter: 'logger',
                    level: 'info'
                });
                should(params.data).have.properties({ transport: 'Callback (2)' });
                params = buffer[1].shift();
                should.not.exist(params);
                params = buffer[2].shift();
                should.not.exist(params);
                done();
            } catch(err) {
                done(err);
            }
        });
    });

    it("Verify write count",function(done) {
        logMgr.writeCount();
        var params = buffer[2].shift();
        should(params).have.property('timestamp');
        should(params).have.properties({
            action: 'counts',
            emitter: 'logger',
            level: 'info'
        });
        should(params.data).have.properties({ info: 11, debug: 1, warn: 1 });
        params = buffer[1].shift();
        should.not.exist(params);
        params = buffer[2].shift();
        should.not.exist(params);
        done();
    });

    it("Verify shutdown",function(done) {
        var transports = logMgr.getTransports();
        should(transports.length).equal(1);
        logMgr.destroying().then(function() {
            transports = logMgr.getTransports();
            should(transports.length).equal(0);
            done();
        }, done);
    });


});
