import { Dict, isDict, isError, isNonEmptyArray, pad } from '@epdoc/typeutil';
import { LoggerError } from './lib/error';

let colorize = require('./lib/colorize');

const REG = {
  format: new RegExp(/^\$(c*)(\d*)\{/, 'g'),
  pad: new RegExp(/^0/)
};

/**
 * Formatting routines that are used internally. Some of these may have external applications
 * and can be accessed by the module's 'format' export property
 */

export class Format {
  static regs: Record<string, RegExp> = {};

  /**
   * General method to format parameters into a JSON object.
   * @param params {Object} Parameters to be logged:
   * @param {Date} params.time - Date object
   * @param {string} params.level - log level (INFO, WARN, ERROR, or any string)
   * @param {string} params.reqId - express request ID, if provided (output if options.sid is
   *   true)
   * @param {string} params.sid - express session ID, if provided (output if options.sid is true)
   * @param {string} params.emitter - name of file or module or emitter (noun)
   * @param {string} params.action - method or operation being performed (verb)
   * @param {string} params.message - text string to output
   * @param {Object} params.static - Static data to be logged in a 'static' column if enabled
   *   via the LogManager.
   * @param {Object} params.data - Arbitrary data to be logged in the 'data' column
   * @param options {Object}
   * @param [options.timestamp=ms] {string} Timestamp output format
   * @param [options.sid] {boolean} Include session info
   * @param [options.static] {boolean} Include static data
   * @returns {Object}
   */
  static paramsToJson(params, options) {
    options || (options = {});
    let json: Dict = {
      timestamp: Format.getTimestamp(params, options.timestamp),
      level: params.level,
      emitter: params.emitter,
      action: params.action,
      data: options.dataObjects ? params.data : JSON.stringify(params.data),
      message: params.message,
      static: options.dataObjects ? params.static : JSON.stringify(params.static)
    };
    if (options.levelMap && options.levelMap.verbose && json.level === 'VERBOSE') {
      json.level = options.levelMap.verbose;
    }
    if (options.levelUppercase) {
      json.level = json.level.toUpperCase();
    }
    if (options.sid) {
      json.sid = params.sid;
      json.reqId = params.reqId;
    }
    if (options.static) {
      json.static = params.static;
    }
    if (params.message instanceof Array) {
      json.message = params.message.join('\n');
    }
    return json;
  }

  /**
   * General method to format parameters into a JSON Array.
   * @param params {Object} Parameters to be logged:
   * @param {Date} params.time - Date object
   * @param {string} params.level - log level (INFO, WARN, ERROR, or any string)
   * @param {string} params.reqId - express request ID, if provided (output if options.sid is
   *   true)
   * @param {string} params.sid - express session ID, if provided (output if options.sid is true)
   * @param {string} params.emitter - name of file or module or emitter (noun)
   * @param {string} params.action - method or operation being performed (verb)
   * @param {string} params.message - text string to output
   * @param {Object} params.static - Arbitrary data to be logged in a 'static' column if enabled
   *   via the LogManager.
   * @param {Object} params.data - Arbitrary data to be logged in the 'data' column
   * @param options {Object}
   * @param [options.timestamp=ms] {string} Timestamp output format
   * @param [options.sid] {boolean} Include session info
   * @param [options.static] {boolean} Include static data
   * @returns {Object}
   */
  static paramsToJsonArray(params, options) {
    let json = [Format.getTimestamp(params, options.timestamp), params.level.toUpperCase()];
    if (options.sid) {
      json.push(params.reqId ? params.reqId : 0);
      json.push(params.sid ? params.sid : '');
    }
    json.push(params.emitter ? params.emitter : '');
    json.push(params.action ? params.action : '');
    json.push(params.message);
    //json = json.concat(params.message?params.message:"");
    if (options.static) {
      json.push(params.static ? params.static : {});
    }
    if (params.data) {
      json.push(params.data);
    }
    return json;
  }

  /**
   * General method to format parameters into a formatted string that can handle winston-like
   * console output. See the default template in the code to see how format string templates. Non
   * colorized strings use '${ts}' format, while colorized used '%{ts}' format.
   * @param params {Object} Parameters to be logged:
   * @param {Date} params.time - Date object
   * @param {string} params.level - log level (info, warn, error, etc)
   * @param {string} params.reqId - express request ID, if provided (output if options.sid is
   *   true)
   * @param {string} params.sid - express session ID, if provided (output if options.sid is true)
   * @param {string} params.emitter - name of file or module or emitter (noun)
   * @param {string} params.action - method or operation being performed (verb)
   * @param {string} params.message - text string to output
   * @param {Object} params.static - Arbitrary data to be logged in a 'static' column if enabled
   *   via the LogManager.
   * @param {Object} params.data - Arbitrary data to be logged in the 'data' column
   * @param options {Object}
   * @param [options.timestamp=ms] {string} Timestamp output format
   * @param [options.sid] {boolean} Include session info
   * @param [options.static] {boolean} Include static data
   * @returns {Object}
   */
  static paramsToString(params, options) {
    let template = options.template;
    if (!template) {
      template = '${ts} - $c5{level} [${emitter}/${action}] $c{message}';
      if (options.sid) {
        template += ' ${reqId}/${sid}';
      }
    }
    let output = template;

    function replace(key, value) {
      if (!Format.regs[key]) {
        Format.regs[key] = new RegExp('\\$c*\\d*{' + key + '}', 'g');
      }
      let m = output.match(Format.regs[key]);
      if (m && m.length) {
        let p = m[0].match(REG.format);
        if (p[2]) {
          let plen = parseInt(p[2], 10);
          if (plen) {
            if (REG.pad.test(p[2])) {
              if (typeof value === 'number' || String(parseInt(value, 10)) === value) {
                value = Format.pad(value, p[2]);
              } else {
                plen = Math.max(plen, String(value).length);
                value = pad(value, plen, ' ');
              }
            } else {
              plen = Math.max(plen, String(value).length);
              value = Format.rightPad(value, ' ', plen);
            }
          }
        }
        if (p[1] === 'c' && options.colorize) {
          value = colorize.colorize(params.level, value);
        }
        output = output.replace(Format.regs[key], value);
      }
    }

    replace('ts', Format.getTimestamp(params, options.timestamp));
    replace('level', params.level.toUpperCase()); // String(params.level.toUpperCase() + '       ').substr(0, 7));

    if (options.sid) {
      replace('reqId', params.reqId ? params.reqId : '0');
      replace('sid', params.sid ? params.sid : '');
    }
    replace('emitter', params.emitter ? params.emitter : '');
    replace('action', params.action ? params.action : '');
    replace('message', params.message ? params.message : '');

    if (options.static) {
      replace('static', JSON.stringify(params.static ? params.static : {}));
    }
    replace('data', JSON.stringify(params.data ? params.data : {}));
    return output;
  }

  static getTimestamp(params, format) {
    if (format === 'smstime') {
      return String(params.time.getTime());
    } else if (format === 'iso') {
      return params.time.toISOString();
    } else {
      return Format.formatMS(params.timeDiff);
    }
  }

  /**
   *
   * @param n {number} number to pad with leading zeros.
   * @param width {number} total width of string (eg. 3 for '005').
   * @param [z='0'] {char} character with which to pad string.
   * @returns {String}
   */
  static pad(n, width, z = '0') {
    n = String(n);
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  static rightPad(str, padString, length) {
    while (str.length < length) str = str + padString;
    return str;
  }

  static leftPad(str, padString, length) {
    while (str.length < length) str = padString + str;
    return str;
  }

  static formatMS(ms) {
    let milliseconds = ms % 1000;
    let seconds = Math.floor(ms / 1000) % 60;
    let minutes = Math.floor(ms / (60 * 1000));
    return (
      Format.pad(minutes, 2) + ':' + Format.pad(seconds, 2) + '.' + Format.pad(milliseconds, 3)
    );
  }

  static toISOLocaleString(d, bNoMs) {
    function tz(m) {
      return (
        (m < 0 ? '+' : '-') +
        Format.pad(Math.abs(m) / 60, 2) +
        ':' +
        Format.pad(Math.abs(m) % 60, 2)
      );
    }
    let s =
      String(d.getFullYear()) +
      '-' +
      Format.pad(d.getMonth() + 1, 2) +
      '-' +
      Format.pad(d.getDate(), 2) +
      'T' +
      Format.pad(d.getHours(), 2) +
      ':' +
      Format.pad(d.getMinutes(), 2) +
      ':' +
      Format.pad(d.getSeconds(), 2);
    if (bNoMs !== true) {
      s += '.' + Format.pad(d.getMilliseconds(), 3);
    }
    s += tz(d.getTimezoneOffset());
    return s;
  }

  /**
   * Handle  various types of error messages, including MongooseError
   * @param err
   * @returns {string}
   */
  static errorToStringArray(err) {
    if (isError(err)) {
      let msgs = [err.message];
      if (err instanceof LoggerError) {
        if (isNonEmptyArray(err.errors)) {
          err.errors.forEach((e) => {
            if (typeof e === 'string') {
              msgs.push(e);
            } else if (typeof e.message === 'string') {
              msgs.push(e.message);
            }
          });
        } else if (isDict(err.errors) && Object.keys(err.errors).length) {
          Object.keys(err.errors).forEach((name) => {
            let e = err.errors[name];
            if (typeof e === 'string') {
              msgs.push(e);
            } else if (typeof e.message === 'string') {
              msgs.push(e.message);
            }
          });
        }
      }
      return msgs;
    }
  }
}

module.exports = self;
