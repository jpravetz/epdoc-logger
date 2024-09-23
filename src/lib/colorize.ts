/*
 * config.js: Default settings for all levels that winston knows about
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var colors = require('colors/safe');

// Fix colors not appearing in non-tty environments
colors.enabled = true;

var config = {};
config.allColors = {};

config.addColors = function (colors) {
  mixin(config.allColors, colors);
};

config.colorize = function (level, message) {
  message || (message = level);

  var colorized = message;
  if (config.allColors[level] instanceof Array) {
    for (var idx = 0, l = config.allColors[level].length; idx < l; ++idx) {
      colorized = colors[config.allColors[level][idx]](colorized);
    }
  } else if (config.allColors[level].match(/\s/)) {
    var colorArr = config.allColors[level].split(/\s+/);
    for (var idx = 0; idx < colorArr.length; ++idx) {
      colorized = colors[colorArr[idx]](colorized);
    }
    config.allColors[level] = colorArr;
  } else {
    colorized = colors[config.allColors[level]](colorized);
  }

  return colorized;
};

//
// Export config sets
//
config.cli = require('./config/cli-config');
config.npm = require('./config/npm-config');
config.syslog = require('./config/syslog-config');

//
// Add colors for pre-defined config sets
//
config.addColors(config.cli.colors);
config.addColors(config.npm.colors);
config.addColors(config.syslog.colors);

function mixin(target) {
  var args = Array.prototype.slice.call(arguments, 1);

  args.forEach(function (a) {
    var keys = Object.keys(a);
    for (var i = 0; i < keys.length; i++) {
      target[keys[i]] = a[keys[i]];
    }
  });
  return target;
}

module.exports = config;
