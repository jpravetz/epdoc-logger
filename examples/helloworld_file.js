#!/usr/bin/env node
/*****************************************************************************
 * helloworld_file.js
 * Copyright 2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var logMgr = require('../index').getLogManager();
var log = logMgr.getLogger('main');
log.info("Starting application");

var config = {
    path: __dirname + "/tmp.log",
    timestamp: 'iso'
};
//var config = require('config.json');
logMgr.addTransport('file',config).start();

log.info("Hello world");
