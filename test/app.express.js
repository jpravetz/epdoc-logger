/*****************************************************************************
 * app.express.js
 * CONFIDENTIAL Copyright 2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/

var express = require('express');
var request = require('supertest');
var middleware = require('../index').middleware();

describe.only("Express test",function () {

    setTimeout(30*1000);

    var app = express();

    before(function (done) {

        var logMgr = require('../index').logMgr();
        logMgr.start();

        app.use(middleware.reqId());
        //app.use(app.router);
        app.all('*', middleware.responseLogger());
        app.all('*', middleware.routeLogger());
        app.all('*', middleware.routeSeparator());

        app.get('/', function (req, res) {
            res.send({message:'hello world'});
        });

        app.listen(3000);
        done();
    });

    it("test", function (done) {

        request(app)
            .get('/')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });

    });

});
