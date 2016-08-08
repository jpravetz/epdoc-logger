/*****************************************************************************
 * helloworld_file.js
 * Copyright 2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

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
