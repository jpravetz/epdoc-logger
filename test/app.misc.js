/*****************************************************************************
 * app.misc.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var epdocLogger = require('../index');
var should = require('should');

describe("Logger APIs", function () {

    var logMgr;
    var log1;

    it("Init LogManager and Logger", function (done) {
        logMgr = new epdocLogger.LogManager();
        log1 = logMgr.get('module1');
        should(log1.getLevel()).equal('debug');
        log1.action('bake').info("Starting");
        log1.data({ c: 4, e: 7 }).debug("Running", { a: 2, b: 3 });
        done();
    });

    var buffer = [];

    function onMessage (params) {
        buffer.push(params);
    }

    it("Set Callback transport and verify previous messages", function (done) {
        logMgr.addTransport('callback', { callback: onMessage, uid: 1 }).start(function () {
            try {
                var params = buffer.shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'bake',
                    message: 'Starting',
                    emitter: 'module1',
                    level: 'info'
                });
                params = buffer.shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    message: 'Running { a: 2, b: 3 }',
                    emitter: 'module1',
                    level: 'debug'
                });
                should.not.exist(params.action);
                should(params.data).have.properties({ c: 4, e: 7 });
                params = buffer.shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'logger.transport.add',
                    message: "Added transport 'Callback (1)'",
                    emitter: 'logger',
                    level: 'info'
                });
                should(params.data).have.properties({ transport: 'Callback (1)' });
                params = buffer.shift();
                should(params).have.property('timestamp');
                should(params).have.properties({
                    action: 'logger.start.success',
                    message: "Started transport 'Callback (1)'",
                    emitter: 'logger',
                    level: 'info'
                });
                should(params.data).have.properties({ transport: 'Callback (1)' });
                params = buffer.shift();
                should.not.exist(params);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    var log2;

    it("Verify log1 levels", function (done) {
        log2 = logMgr.get('module2');
        log2.error("Doing more");
        var params = buffer.shift();
        should(params).have.property('timestamp');
        should(params).have.properties({
            message: 'Doing more',
            emitter: 'module2',
            level: 'error'
        });
        should.not.exist(params.action);
        log1.action('slide').warn("end");
        var params = buffer.shift();
        should(params).have.property('timestamp');
        should(params).have.properties({
            action: 'slide',
            message: 'end',
            emitter: 'module1',
            level: 'warn'
        });
        params = buffer.shift();
        should.not.exist(params);
        log2.action('slide').verbose("verbose");
        var params = buffer.shift();
        should.not.exist(params);
        logMgr.setLevel('verbose',{transports:true});
        log2.setLevel('verbose');
        log2.action('slide').verbose("verbose");
        var params = buffer.shift();
        should(params).have.properties({
            action: 'slide',
            message: 'verbose',
            emitter: 'module2',
            level: 'verbose'
        });
        params = buffer.shift();
        should.not.exist(params);
        log1.action('slide').verbose("verbose");
        var params = buffer.shift();
        should.not.exist(params);
        should(log1.getLevel()).equal('debug');
        log1.action('slide').debug("debug");
        var params = buffer.shift();
        should(params).have.properties({
            action: 'slide',
            message: 'debug',
            emitter: 'module1',
            level: 'debug'
        });
        log1.action('slide').info("info");
        var params = buffer.shift();
        should(params).have.properties({
            action: 'slide',
            message: 'info',
            emitter: 'module1',
            level: 'info'
        });
        params = buffer.shift();
        should.not.exist(params);
        params = buffer.shift();
        should.not.exist(params);
        done();
    });

    it('Directly test log2 level logic',function(done) {
        log2.setLevel('info');
        should(log2.getLevel()).equal('info');
        should(log2.isAboveLevel('verbose')).equal(false);
        should(log2.isAboveLevel('debug')).equal(false);
        should(log2.isAboveLevel('info')).equal(true);
        should(log2.isAboveLevel('warn')).equal(true);
        should(log2.isAboveLevel('error')).equal(true);
        should(log2.isAboveLevel('fatal')).equal(true);
        done();
    });

    var log3;

    it('Directly test log3 level logic',function(done) {
        logMgr.setLevel('debug',{transports:true});
        log3 = logMgr.get('module3');
        should(log3.getLevel()).equal('debug');
        should(log3.isAboveLevel('verbose')).equal(false);
        should(log3.isAboveLevel('debug')).equal(true);
        should(log3.isAboveLevel('info')).equal(true);
        should(log3.isAboveLevel('warn')).equal(true);
        should(log3.isAboveLevel('error')).equal(true);
        should(log3.isAboveLevel('fatal')).equal(true);
        logMgr.setLevel('info');
        should(log3.getLevel()).equal('debug');
        should(log3.isAboveLevel('verbose')).equal(false);
        should(log3.isAboveLevel('debug')).equal(true);
        should(log3.isAboveLevel('info')).equal(true);
        should(log3.isAboveLevel('warn')).equal(true);
        should(log3.isAboveLevel('error')).equal(true);
        should(log3.isAboveLevel('fatal')).equal(true);
        log3.setLevel('info');
        should(log3.getLevel()).equal('info');
        should(log3.isAboveLevel('verbose')).equal(false);
        should(log3.isAboveLevel('debug')).equal(false);
        should(log3.isAboveLevel('info')).equal(true);
        should(log3.isAboveLevel('warn')).equal(true);
        should(log3.isAboveLevel('error')).equal(true);
        should(log3.isAboveLevel('fatal')).equal(true);
        done();
    });

    it("Verify write count", function (done) {
        logMgr.writeCount();
        var params = buffer.shift();
        should(params).have.property('timestamp');
        should(params).have.properties({
            action: 'counts',
            emitter: 'logger',
            level: 'info'
        });
        // should(params.data).have.properties({ info: 11, debug: 1, warn: 1 });
        params = buffer.shift();
        should.not.exist(params);
        params = buffer.shift();
        should.not.exist(params);
        done();
    });

    it("Verify shutdown", function (done) {
        var transports = logMgr.getTransports();
        should(transports.length).equal(1);
        logMgr.destroying().then(function () {
            transports = logMgr.getTransports();
            should(transports.length).equal(0);
            done();
        }, done);
    });


});
