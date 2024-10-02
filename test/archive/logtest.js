#!/usr/bin/env node
/*****************************************************************************
 * archive/logtest.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';
let _ = require('underscore');

const TIMER_INTERVAL = 2000;
const BUFFER_INTERVAL = 0; //1000;
let type = 'console';
//let type = "sos";
//let type = "file";

let type = process.argv[process.argv.length - 1];

console.log('type = ' + type);

let Logger = require('../index');
Logger.setGlobalLogLevel('verbose');

_.each(['console', 'file', 'sos'], function (t) {
  console.log("Validating '" + t + "' logger class");
  let LoggerClass = Logger.getLoggerClass(t);
  let logger = new LoggerClass();
  if (logger.type() !== t) {
    console.log('ERROR: Logger type is not ' + t);
  }
});

const log = require('../index').get('test');
let params = { path: __dirname + '/temp.log', buffer: BUFFER_INTERVAL };
console.log("Testing for type '" + type + "'" + ' and parameters ' + JSON.stringify(params));

log.date();
log.info('Hello world');

Logger.setLogger(type, params);
log.info('Hello ' + Logger.getCurrentLogger().type());
log.date();
log.verbose('Verbose message');
log.data('obj', { a: 3 }).debug('Debug message');
log.error('Error message');
log.error('Error message');
log.fatal('Danger, danger!');
log.info();
log.warn('Warning message');
log.log('info', ['First line of message', 'Second line of message', 'third line of message']);
Logger.logMessage({
  message: 'Calling Logger.writeMessage',
  emitter: 'MyModule',
  sid: 'MySessionId',
  data: { key: 'value' }
});

let idx = 0;
let timer = setInterval(function () {
  log.date();
  log.debug('Message %d', ++idx);
  let t = Logger.getStartTime();
  log.warn('We started at this time %s', new Date(t));
}, TIMER_INTERVAL);

console.log('done');
