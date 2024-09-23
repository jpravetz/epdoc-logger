import { isString } from '@epdoc/typeutil';
import fs from 'node:fs';
import path from 'node:path';
import { TransportOptions } from '../types';
import { LogTransport } from './base';

export type FileTransportOptions = TransportOptions & {
  path: string;
};

export class FileTransport extends LogTransport {
  _path: string;
  _stream: fs.WriteStream;
  _bIncludeSid = options && (options.sid === false || options.bIncludeSid === false) ? false : true;
  _bIncludeStatic = options && options.static === false ? false : true;
  _timestampFormat = _options.timestamp || 'ms';
  _level = _options.level;
  _bReady = true;
  _buffer = []; // Used in case of stream backups

  constructor(options: FileTransportOptions) {
    super(options);
    this._path = options.path;
  }

  get writable(): boolean {
    return true;
  }

  get type(): string {
    return 'file';
  }

  validateOptions(previous?: LogTransport): Error | undefined {
    if (!isString(this._path)) {
      return new Error('File not specified');
    }
    if (previous && previous.type === 'sos') {
      return new Error("Cannot switch from 'sos' logger to 'file' logger");
    }
  }

  open(onError: (err: Error) => void, onClose: () => void): Promise<any> {
    try {
      let folder = path.dirname(this._path);
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }
      this._stream = fs.createWriteStream(this._path, { flags: 'a' });
      this._stream.on('error', function (err) {
        onError && onError(err);
      });
      this._stream.on('close', function () {
        this.bReady = false;
        onClose && onClose();
      });
      this.bReady = true;
      return Promise.resolve(true);
      // onSuccess && onSuccess();
    } catch (err) {
      return Promise.reject(err);
      // onError && onError(err);
    }
  }
}

/**
 * Create a new File transport to output log messages to a file.
 *
 * @param options {Object} Output options include:
 * @param [options.sid] {boolean} - If true then output express request and session IDs, otherwise
 *   do not output these values
 * @param options.path {string} - The path to the output file to append to.
 * @param [options.timestamp=ms] {string} - Set the format for timestamp output, must be one of
 *   'ms' or
 *   'iso'.
 * @param [options.format=jsonArray] {String|function} - Set the format for the output line. Must
 *   be one of 'json', 'jsonArray', 'template', or a function that takes params and options as
 *   parameters.
 * @param [options.template] {String} - Provide a template string to use for output when
 *   options.format is 'string', substitutes ${ts} %{level} ${emitter} type strings, where '%'
 *   indicates string should be colorized.
 * @param [options.static=true] {boolean} - Set whether to output a 'static' column.
 * @param [options.level] {string} - Log level above which to output log messages, overriding
 *   setting for LogManager.
 * @constructor
 */

let FileTransportOld = function (options) {
  this.options = options || {};
  this.bIncludeSid =
    options && (options.sid === false || options.bIncludeSid === false) ? false : true;
  this.bIncludeStatic = options && options.static === false ? false : true;
  this.timestampFormat = this.options.timestamp || 'ms';
  this.level = this.options.level;
  this.path = options.path;
  this.sType = 'file';
  this.bReady = true;
  this.buffer = []; // Used in case of stream backups
  this.writable = true;
};

FileTransportOld.prototype = {
  constructor: FileTransportOld,

  /**
   * Test if the transport matches the argument.
   * @param transport {string|object} If a string then matches if equal to 'file'. If an object
   *   then matches if transport.type equals 'file' and transport.path equals this transports
   *   path property.
   * @returns {boolean} True if the transport matches the argument
   */
  match: function (transport) {
    if (_.isString(transport) && transport === this.sType) {
      return true;
    }
    if (_.isObject(transport) && transport.type === this.sType && transport.path === this.path) {
      return true;
    }
    return false;
  },

  /**
   * Return true if this logger is ready to accept write operations.
   * Otherwise the caller should buffer writes and call write when ready is true.
   * @returns {boolean}
   */
  ready: function () {
    return this.bReady;
  },

  /**
   * Used to clear the logger display. This is applicable only to certain transports, such
   * as socket transports that direct logs to a UI.
   */
  clear: function () {},

  /**
   * Write a log line
   * @param params {Object} Parameters to be logged:
   *  @param {Date} params.time - Date object
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
   */
  write: function (params) {
    let msg = this._formatLogMessage(params);
    this._write(msg + '\n');
  },

  _write: function (msg) {
    if (this.writable) {
      this.writable = this.stream.write(msg, 'ascii');
    } else {
      this.buffer.push(msg);
      if (!this.drainRegistered) {
        this.stream.once('drain', this.flush);
        this.drainRegistered = true;
      }
    }
  },

  /**
   * Used only if buffering (if options.buffer is > 0)
   * Flushes everything in the buffer and starts a timer to automatically
   * flush again after options.buffer time
   */
  flush: function (cb) {
    this.drainRegistered = false;
    if (this.buffer.length) {
      let flushing = this.buffer;
      this.buffer = [];
      for (let idx = 0; idx < flushing.length; ++idx) {
        this._write(flushing[idx]);
      }
    }
    cb && cb();
  },

  end: function (cb) {
    this.flush();
    this.bReady = false;
    if (this.stream) {
      this.stream.end();
    }
    cb && cb();
  },

  stop: function (cb) {
    this.end();
    if (this.stream) {
      this.stream.destroy();
    }
    this.stream = undefined;
    cb && cb();
  },

  _formatLogMessage: function (params) {
    let opts = {
      timestamp: this.timestampFormat,
      sid: this.bIncludeSid,
      static: this.bIncludeStatic,
      colorize: false,
      template: this.options.template
    };
    if (_.isFunction(this.options.format)) {
      return this.options.format(params, opts);
    } else if (this.options.format === 'template') {
      return format.paramsToString(params, opts);
    } else if (this.options.format === 'json') {
      let json = format.paramsToJson(params, opts);
      return JSON.stringify(json);
    } else {
      let json = format.paramsToJsonArray(params, opts);
      return JSON.stringify(json);
    }
  },

  setLevel: function (level) {
    this.level = level;
  },

  toString: function () {
    return 'File (' + this.path + ')';
  },

  getOptions: function () {
    return { path: this.path };
  },

  last: true
};

module.exports = FileTransportOld;
