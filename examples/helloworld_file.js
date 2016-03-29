/*****************************************************************************
 * helloworld_file.js
 * CONFIDENTIAL Copyright 2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/

var logMgr = require('../index').logMgr();
var log = logMgr.get('main');
log.info("Starting application");

var config = {
    path: __dirname + "/tmp.log",
    timestamp: 'iso'
};
//var config = require('config.json');
logMgr.setTransport('file',config);

log.info("Hello world");
