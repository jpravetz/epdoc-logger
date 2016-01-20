/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var Logger = require('../index');

describe("Logger test", function () {

    var logger;
    var log;

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


});