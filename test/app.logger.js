/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var Logger = require('../src/logger');

describe("Logger test", function () {

    var logger;
    var log;

    it("Logger console", function (done) {

        logger = new Logger();
        log = logger.get('default');
        log.info("Starting");
        logger.start();
        log.info("Running");
        done();

    });


});