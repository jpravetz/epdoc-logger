#!/usr/bin/env node
/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

const TIMER_INTERVAL = 2000;
const BUFFER_INTERVAL = 0; //1000;
var type = "console";
//var type = "sos";
//var type = "file";

var Logger = require('../index');
Logger.setGlobalLogLevel('verbose');
var log = require('../index').get('reqtest');

var middleware = Logger.middleware();

var req = Logger.request();
var res = Logger.response(req, onSend);
function onSend (msg) {
    log.action('onSend').info(msg);
    process.exit(0);
};

middleware.reqId()(req, res, function (err) {
    if (err) {
        log.error(error);
    } else {
        log.logObj(req);
        middleware.responseLogger()(req, res, function (err) {
            if (err) {
                log.error(error);
            } else {
                res.info('Added response logger');
                middleware.routeSeparator()(req, res, function (err) {
                    if (err) {
                        log.error(error);
                    } else {
                        res.pushRouteInfo('myrouteinfo');
                        res.logObj({x: 3, y: 4}).info('Info goes here');
                        res.success(200, "Finished successfully");
                    }
                });
            }
        });
    }
});

console.log('done');