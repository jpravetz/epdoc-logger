// import { Color } from 'colors';

// // Fix colors not appearing in non-tty environments
// // colors.enabled = true;

// let config = { allColors: {} };

// class MyColors implements Color {
//   constructor() {}
// }

// const x = (colors = new MyColors());

// config.addColors = function (colors) {
//   mixin(config.allColors, colors);
// };

// const color: Color;

// config.colorize = function (level, message) {
//   message || (message = level);

//   let colorized = message;
//   if (config.allColors[level] instanceof Array) {
//     for (let idx = 0, l = config.allColors[level].length; idx < l; ++idx) {
//       colorized = colors[config.allColors[level][idx]](colorized);
//     }
//   } else if (config.allColors[level].match(/\s/)) {
//     let colorArr = config.allColors[level].split(/\s+/);
//     for (let idx = 0; idx < colorArr.length; ++idx) {
//       colorized = colors[colorArr[idx]](colorized);
//     }
//     config.allColors[level] = colorArr;
//   } else {
//     colorized = colors[config.allColors[level]](colorized);
//   }

//   return colorized;
// };

// //
// // Export config sets
// //
// config.cli = require('./config/cli-config');
// config.npm = require('./config/npm-config');
// config.syslog = require('./config/syslog-config');

// //
// // Add colors for pre-defined config sets
// //
// config.addColors(config.cli.colors);
// config.addColors(config.npm.colors);
// config.addColors(config.syslog.colors);

// function mixin(target) {
//   let args = Array.prototype.slice.call(arguments, 1);

//   args.forEach(function (a) {
//     let keys = Object.keys(a);
//     for (let i = 0; i < keys.length; i++) {
//       target[keys[i]] = a[keys[i]];
//     }
//   });
//   return target;
// }

// module.exports = config;
