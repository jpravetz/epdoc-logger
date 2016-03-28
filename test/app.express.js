/*****************************************************************************
 * app.express.js
 * CONFIDENTIAL Copyright 2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/

var express = require('express');
var request = require('supertest');
var should = require('should');
var middleware = require('../index').middleware();

describe.only("Express response middleware", function () {

    this.timeout(300000);

    var app = express();

    before(function (done) {

        var logMgr = require('../index').logMgr();
        logMgr.start();

        app.use(middleware.reqId());
        //app.use(app.router);
        app.all('*', middleware.responseLogger());
        app.all('*', middleware.routeSeparator());
        app.all('*', middleware.routeLogger());

        app.get('/a', function (req, res) {
            res.send({ message: 'hello world' });
        });
        app.get('/b', function (req, res) {
            res.json({ message: 'hello world' });
        });
        app.get('/c', function (req, res) {
            res.end('hello world');
        });

        app.listen(3000);
        done();
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
                    should(res.body).have.property('message','hello world');
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
                    should(res.body).have.property('message','hello world');
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
                    should(res).have.property('text','hello world');
                    done();
                }
            });
    });

});
