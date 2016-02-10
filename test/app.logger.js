/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var Logger = require('../index');

describe("Logger test", function () {

    var logger;
    var log;
    var token = '4d7f2890-1e74-4b61-9844-ffd8acc62911';

    it("Logger console", function (done) {
        log = Logger.get('moduleName');
        log.action('bake').info("Starting");
        log.info("Running",{a:2,b:3});
        done();
    });

    it("Logger console2", function (done) {
        log = Logger.get('module2');
        log.info("Doing more");
        log.action('slide').info("end");
        done();
    });

    it('Logger loggly',function(done) {
        var opts = {
            token: token
        };
        var logMgr = Logger.logMgr();
        logMgr.setTransport('loggly',opts);
        log = logMgr.get('module3');
        log.info("Doing even more");
        log.action('myaction').info("end");
        logMgr.writeCount();
        logMgr.destroying().then(function() {
            done();
        }, function(err) {
            done(err);
        });
    });


});