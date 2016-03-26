/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var Path = require('path');
var LogMgr = require('../src/log_mgr');

describe("Logger file test", function () {

    var token = '4d7f2890-1e74-4b61-9844-ffd8acc62911';

    it("Write file as json array", function (done) {
        var opts = {
            transport: {
                type: "file",
                path: Path.resolve(__dirname, '../log/output_simple.log')
            },
            autoRun: true
        };
        var logMgr = new LogMgr(opts);
        log = logMgr.get('moduleName');
        log.action('bake').info("Starting");
        log.info("Running", { a: 2, b: 3 });
        done();
    });

    it("write file as json", function (done) {
        var opts = {
            transport: {
                type: "file",
                path: Path.resolve(__dirname, '../log/output_json.log'),
                format: 'json',
                timestamp: 'smstime'
            },
            autoRun: true
        };
        var logMgr = new LogMgr(opts);
        log = logMgr.get('moduleName');
        log.action('bake').info("Starting");
        log.info("Running", { a: 2, b: 3 });
        done();
    });

    it("write file as json array", function (done) {
        var opts = {
            transport: {
                type: "file",
                path: Path.resolve(__dirname, '../log/output_jsonarray.log'),
                timestamp: "iso",
                custom: true,
                sid: true
            },
            autoRun: true
        };
        var logMgr = new LogMgr(opts);
        log = logMgr.get('moduleName');
        log.ctx = { req: { reqId: 'reqId', sid: 'sessionId'} };
        log.action('bake').set({custom:true}).data({ data: { a: 2, b: 3 } }).info("Starting");
        log.info("Running");
        done();
    });


});
