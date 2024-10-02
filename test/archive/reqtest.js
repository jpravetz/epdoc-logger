#!/usr/bin/env node
/*****************************************************************************
 * archive/reqtest.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

let type = 'console';
//let type = "sos";
//let type = "file";

let Logger = require('../index');
Logger.setGlobalLogLevel('verbose');
const log = Logger.get('reqtest');

let middleware = Logger.middleware();

let req = Logger.request();
let res = Logger.response(req, onSend);
function onSend(msg) {
  log.action('onSend').info(msg);
  process.exit(0);
}

middleware.reqId()(req, res, function (err) {
  if (err) {
    log.error(error);
  } else {
    log.logObj(req);
    let opts = {}; // {responseBuilder:'json-api'};
    middleware.responseLogger(opts)(req, res, function (err) {
      if (err) {
        log.error(error);
      } else {
        res.info('Added response logger');
        middleware.routeSeparator()(req, res, function (err) {
          if (err) {
            log.error(error);
          } else {
            res.pushRouteInfo('myrouteinfo');
            //res.data({key:'my return value'}).setParam({include:"string here"});
            //res.errorCode(33).errorParams({extra:'here'});
            res.errorParams({ extra: 'here' }).onError(new Error('My exception'));
            res.logObj({ x: 3, y: 4 }).info('Info goes here');
            res.success(200, 'Finished successfully');
          }
        });
      }
    });
  }
});

console.log('done');
