/*****************************************************************************
 * log_listener.js
 * Copyright 2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var _ = require('underscore');

var LogListener = function (options) {
  this.buffer = [];
  this.output = options && options.output ? options.output : false;
  this.interval = (options && options.interval) || 500;
};

LogListener.prototype.clear = function () {
  this.buffer = [];
};

LogListener.prototype.onMessage = function (params) {
  this.buffer.push(params);
  if (this.output === true) {
    console.log(JSON.stringify(params));
  }
};

LogListener.prototype.wait = function (params, bClear, bRemove) {
  var self = this;

  function compareObject(p, obj) {
    if (!obj) {
      return false;
    }
    var pkeys = Object.keys(p);
    var bMatch = true;
    for (var pdx = 0; bMatch && pdx < pkeys.length; pdx++) {
      var pkey = pkeys[pdx];
      if (p[pkey] instanceof RegExp) {
        if (typeof obj[pkey] !== 'string' || !p[pkey].test(obj[pkey])) {
          bMatch = false;
        }
      } else if (typeof p[pkey] === 'object') {
        bMatch = bMatch && compareObject(p[pkey], obj[pkey]);
      } else {
        if (p[pkey] != obj[pkey]) {
          bMatch = false;
        }
      }
    }
    return bMatch;
  }

  function findIndex() {
    for (var idx = 0; idx < self.buffer.length; idx++) {
      var m = self.buffer[idx];
      var bMatch = compareObject(params, m);
      if (bMatch) {
        return idx;
      }
    }
    return -1;
  }

  if (self.output === 'pre') {
    console.log('Waiting to match ' + JSON.stringify(params));
  }

  function getFirstMatch() {
    var msg;
    var idx = findIndex();
    if (idx >= 0) {
      msg = self.buffer[idx];
      if (bClear) {
        if (self.output === 'pre') {
          var pre = self.buffer.slice(0, idx + 1);
          var actions = _.map(pre, function (item) {
            return item.action;
          });
          console.log('Deleting: ' + actions.join(', '));
        }
        self.buffer = self.buffer.slice(idx + 1);
      } else if (bRemove) {
        self.buffer = self.buffer.splice(idx, 1);
      }
    }
    return msg;
  }

  var msg = getFirstMatch();
  if (msg) {
    return Promise.resolve(msg);
  } else {
    return new Promise(function (resolve) {
      var timer = setInterval(function () {
        var msg = getFirstMatch();
        if (msg) {
          clearInterval(timer);
          resolve(msg);
        }
      }, self.interval);
    });
  }
};

module.exports = LogListener;
