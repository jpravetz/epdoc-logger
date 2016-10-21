/*****************************************************************************
 * app.express.js
 * Copyright 2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var express = require('express');
var request = require('supertest');
var should = require('should');
var elogger = require('../index');
var middleware = elogger.middleware();

describe("Express response middleware", function () {

    this.timeout(300000);

    var app = express();

    before(function (done) {

        var logMgr = new elogger.LogManager();
        logMgr.starting().then(function () {
            var log = logMgr.getLogger('app');
            log.info("Adding middleware");
            app.use(middleware.reqId());
            //app.use(app.router);
            app.all('*', middleware.responseLogger({logMgr:logMgr}));
            app.all('*', middleware.routeSeparator());
            app.all('*', middleware.routeLogger());

            app.get('/a', function (req, res) {
                req.log.pushName('a').resetElapsed();
                setTimeout(function () {
                    req.log.elapsed().info("Timer should be about 500");
                    res.send({ message: 'hello world' });
                }, 500);
            });
            app.get('/b', function (req, res) {
                res.json({ message: 'hello world' });
            });
            app.get('/c', function (req, res) {
                req.log.pushName('c').resetElapsed('c');
                setTimeout(function () {
                    req.log.elapsed('c').info("Timer should be about 250");
                    res.end('hello world');
                }, 250);
            });

            app.listen(3000);
            done();
        }, done);

    });

    it("send", function (done) {
        request(app)
            .get('/a')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    should(res).have.property('body');
                    should(res.body).have.property('message', 'hello world');
                    done();
                }
            });
    });

    it("json", function (done) {
        request(app)
            .get('/b')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    should(res).have.property('body');
                    should(res.body).have.property('message', 'hello world');
                    done();
                }
            });
    });

    it("end", function (done) {
        request(app)
            .get('/c')
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    should(res).have.property('text', 'hello world');
                    done();
                }
            });
    });

});
