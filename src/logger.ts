/*****************************************************************************
 * logger.js
 * Copyright 2012-2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

import { Dict, isArray, isNonEmptyString } from '@epdoc/typeutil';
import { LogLevel, LogLevelName, LogLevelValue } from './level';
import { LogManager } from './log-manager';
import { LoggerMessageBuilder, LogMsgBuilder } from './msg-builder';
import { Style } from './style';
import { LoggerLineOpts, LogMessage, LogMessageConsts } from './types';

/**
 * <p>Create a new log object with methods to log to the transport that is attached to
 * <code>logMgr</code>. This log object can be attached to another object, for example an
 * [Express]{@link http://expressjs.com/} request object, in order to pass the log object down
 * through a calling stack. If a context is passed in, letious properties may be harvested off of
 * the req property. These include: req._reqId (populates reqId column), req.sid (uses
 * req.session.id or req.sessionId and populates sid column), req._startTime and req._hrStartTime
 * (either can be used to determine the response time for a request).
 *
 * @class A Logger object has methods to write log information to a specified transport.
 * The line below shows sample output when writting to the Console transport.
 *
 * <p><code>["00:03.767","INFO",0,"","main","app.initialized","We've initialized the
 * app",{"process":{"pid":12345}}]</code>
 *
 * <p>For the above output, time is since this module was first initialized and is shown in
 * milliseconds. This is followed by the log level, request ID, session ID, module/emitter name,
 * action, message and arbitrary data.
 *
 * <p>The format of the output is determined by the transport and it's settings.
 *
 * @example
 * // Create a new Logger object step by step
 * let EpdocLogger = require('epdoc-logger');
 * let LogManager = EpdocLogger.LogManager;
 * let Logger = EpdocLogger.Logger;
 * let logMgr = new LogManager();
 * let log = new Logger(gLogMgr,'logtest');
 *
 * @example
 * // Create a new Logger object the easy way using global LogManager.
 * let log = require('epdoc-logger').get('logtest');
 *
 *
 * @param  {LogManager} logMgr - The parent LogManager object that specifies the transport and
 *   provides lower-level output methods
 * @param [emitter] {string|string[]} The name of the module or emitter that is emitting the
 *   log message, used to populate the <code>emitter</code> output column. This can be modified to
 *   show method call hierarchy by calling <code>pushName</code> and <code>popName</code>.
 * @param [context] {object} A context object. For [Express]{@link http://expressjs.com/} or
 *   [koa]{@link http://koajs.com/} this would have <code>req</code> and <code>res</code>
 *   properties.
 * @constructor
 */

export class Logger {
  protected _logMgr: LogManager;
  // protected _separatorOpts: SeparatorOpts;
  protected _name: string;
  protected _reqId: string;
  protected _sid: string;
  protected _emitter: string[];
  protected _ctx: Dict;
  protected _style: Style;
  protected _level: LogLevelValue;
  // protected bErrorStack: boolean;
  protected _logData: object;
  protected _logAction: string;
  protected _stack: string[] = [];
  protected _initialized: boolean = false;
  protected _line: LogMsgBuilder;
  protected _silent: boolean;

  constructor(
    logMgr: LogManager,
    msgConsts: LogMessageConsts,
    context: object
  ) {
    this._logMgr = logMgr;
    // this._separatorOpts = Object.assign({}, separatorOpts);
    if (isNonEmptyString(msgConsts.emitter)) {
      this._emitter = [msgConsts.emitter];
    } else if (isArray(msgConsts.emitter)) {
      this._emitter = msgConsts.emitter;
      this._name = 'Logger#' + msgConsts.emitter.join('.');
      this._stack = msgConsts.emitter;
    } else {
      this._name = 'Logger#' + this._emitter.join('.');
      this._stack = this._emitter;
    }
    // this.logLevel = logMgr.levelThreshold ? logMgr.levelThreshold : logMgr.LEVEL_DEFAULT;
    // this.bErrorStack = logMgr.errorStackThreshold ? logMgr.errorStackThreshold : false;
    this._logData;
    // Action column
    this._logAction;

    const msg: LogMessage = {
      emitter: this._emitter,
      reqId: this._reqId,
      sid: this._sid,
    };


    // Contains Express and koa req and res properties
    // If ctx.req.sessionId, ctx.req.sid or ctx.req.session.id are set, these are used for sid
    // column. If ctx.req._reqId, this is used as reqId column
    this._ctx = context;
    this.addLevelMethods();
    this._line = new LoggerMessageBuilder(
      this._logMgr,
       msg
    ) as LogMsgBuilder;
  }

  get name() {
    return this._name;
  }

  protected get logMgr(): LogManager {
    return this._logMgr;
  }

  protected get logLevels(): LogLevel {
    return this._logMgr.logLevels;
  }

  setContext(ctx: object): this {
    this._ctx = ctx;
    return this;
  }

  // trace(...args: any[]): LoggerLineInstance {
  //   return this.initLine(logLevel.trace, ...args);
  // }

  private addLevelMethods(): this {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    const levelDefs = this._logLevels.levelDefs;
    Object.keys(levelDefs).forEach((name) => {
      if (methodNames.includes(name)) {
        throw new Error(`Cannot declare level with reserved name ${name}`);
      }
      (this as any)[name] = (...args: any[]): LogMsgBuilder => {
        // @ts-ignore
        return this.initLine(levelDefs[name], ...args);
      };
    });
    return this;
  }

  private initLine(level: LogLevelValue, ...args: any[]): LogMsgBuilder {
    if (this._initialized) {
      const unemitted = this._line.partsAsString();
      throw new Error(`Emit the previous log message before logging a new one: ${unemitted}`);
    }
    const opts: LoggerLineOpts = {
      reqId: this._reqId,
      sid: this._sid,
      logLevels: this._logLevels,
      separatorOpts: this._separatorOpts
    };
    return this._line
      .clear()
      .setLevel(level)
      .setInitialString(...args);
  }

  // addLevelMethod(level) {
  //   /**
  //    * Log a message at one of the log levels. The message can contain arguments (e.g 'Hello
  //    * %s',
  //    * 'world') or an Error object.
  //    */
  //   return function (err) {
  //     if (err instanceof Error) {
  //       let msgs = format.errorToStringArray(err);
  //       if (this.bErrorStack && err.stack) {
  //         let items = err.stack.split(/\n\s*/);
  //         this.data({ error: { code: err.code, stack: items } });
  //       } else if (!_.isUndefined(err.code)) {
  //         this.data({ error: { code: err.code } });
  //       }
  //       return this.logArgs(level, msgs);
  //     } else {
  //       return this.logArgs(level, Array.prototype.slice.call(arguments));
  //     }
  //   };
  // }

  // misc() {
  //   for (let idx = 0; idx < this._logMgr.LEVEL_ORDER.length; idx++) {
  //     let level = this._logMgr.LEVEL_ORDER[idx];
  //     self[level] = addLevelMethod(level);
  //   }

  //   // Set so these can be used internally
  //   this._info = this[this._logMgr.LEVEL_INFO];
  // }

  /**
   * Set whether to log a stack for Error objects. If not set in the constructor, then inherits
   * this value from the LogManager.
   * @param [bShow=true] {boolean}
   * @returns {Logger}
   */
  // errorStack(threshold: LogLevelValue) {
  //   this._logLevels.errorStackThreshold = threshold;
  //   return this;
  // }

  /**
   * Log a separator line that contains a message with '#' characters.
   * @return {Logger}
   */
  separator(options: SeparatorOpts) {
    if (this._logLevels.meetsThreshold(this._logLevels.fromName('info'))) {
      const logMsg: LogMessage = {
        level: this._logLevels.fromName('info'),
        action: 'logger.separator',
        separator: true
      };
      this._logMgr.logMessage(logMsg);
    }
    return this;
  }

  /**
   * Log a key,value or an object. If an object the any previous logged objects
   * are overwritten. If a key,value then add to the existing logged object.
   * Objects are written when a call to info, etc is made.
   *
   * @deprecated Use ```data``` method instead.
   * @param key {string|number|object} If a string or number then key,value is added, else the
   *   object ```key``` is added
   * @param [value] If key is a string or number then data.key is set to value
   * @return {Logger}
   */
  logObj(key: string, value: any) {
    return this._setData('data', key, value);
  }

  /**
   * Set <i>static data</i> that is output in a separate column called <code>static</code>`.
   * This column must be specifically enabled via the LogManager constructor's
   * <code>static</code>
   * option. Static data is not cleared when a log message is written, and so persists for the
   * life of the log object.
   *
   * @param key {String|object} If a string then sets staticData.key = value, otherwise extends
   *   staticData with key
   * @param value {*} (Optional) Set key to this value
   * @return {Logger}
   */
  set(key: string, value: any) {
    return this._setData('staticData', key, value);
  }

  /**
   * Set a property or multiple properties in the <code>data</code> column.
   * @example
   * log.data('a',3).data('b',4).info();
   * log.data({a:3,b:4}).info();
   *
   * @param {string|object} key - If a string then sets <code>data[key]</code> to
   *   <code>value</code>. Otherwise extend the object <code>data</code> with the object
   *   <code>key</code>.
   * @param [value] {string} If key is a string then sets <code>data[key]</code> to this value.
   * @return {Logger}
   */
  data(key: string, value: any) {
    return this._setData('logData', key, value);
  }

  /**
   * Common method used by the {@link Logger#data} method.
   * @param field
   * @param key
   * @param value
   * @returns {Logger}
   * @private
   */
  _setData(field: string, key: string, value: any) {
    if (!this[field]) {
      this[field] = {};
    }
    if (typeof key === 'string' || typeof key === 'number') {
      this[field][key] = value;
    } else {
      this[field] = _.extend(this[field], key);
    }
    return this;
  }

  /**
   * A method to add context to the method stack that has gotten us to this point in code.
   * The context is pushed into a stack, and the full stack is output as the module/emitter
   * property of the log message.
   *
   * <p>This method is usually called at the entry point of a function. Can also be
   * called by submodules, in which case the submodules should call [popName]{@link
   * Logger#popName} when returning. Note that it is not necessary to call [popName]{@link
   * Logger#popName} when used in the context of an Express context and terminating a request
   * with a response.
   *
   * @param name (required) String in the form 'api.org.create' (route.method or
   *   route.object.method).
   * @return Response object
   * @see Logger#popName
   */
  pushName(name: string) {
    this._stack.push(name);
    return this;
  }

  /**
   * See pushRouteInfo. Should be called if returning back up a function chain. Does not need to
   * be called if the function terminates the request with a response.
   * @param options Available options are 'all' if all action contexts are to be removed from the
   *   _logging stack.
   * @return Response object
   * @see Logger#pushName
   */
  popName(options: any) {
    if (options && options.all === true) {
      this._stack = [];
    } else {
      this._stack.pop();
    }
    return this;
  }

  getStack() {
    return this._stack;
  }

  /**
   * Tell logger whether we want to log the json response that we may be sending via express.
   * This is only used in conjunction with reponse.js
   * @param v
   */
  // logResponse: function (v) {
  //     this.logResponse = (v === false) ? false : true;
  // },

  /**
   * Adds a 'key' (default key = 'elapsed') attribute to data column, which is the time
   * since the timer was reset. Must first call resetElapsed() to reset the timer, else the value
   * will be 0.
   * @param {string} [name='elapsed'] The timer name. This allows multiple timers to be run at
   *   the same time, or just use the default 'elapsed' timer.
   * @param {string} [key='elapsed'] The name of the attribute to add to the data column.
   * @return {Object} this
   */
  elapsed(name: string, key: string) {
    name || (name = 'elapsed');
    key || (key = 'elapsed');
    this._timer || (this._timer = {});
    return this._setData('logData', key, this.getElapsed(name));
  }

  /**
   * Get the number of milliseconds since resetElapsed() has been called. This can be used to
   * measure the duration of requests or other events that are made within the context of this
   * request, when used with expressjs.
   * @param {string} [name='elapsed'] Allows multiple timers to be run at the same time, or just
   *   use the default timer.
   */
  getElapsed(name: string) {
    name || (name = 'elapsed');
    this._timer || (this._timer = {});
    if (this._timer[name]) {
      return new Date().getTime() - this._timer[name];
    }
    return 0;
  }

  /**
   * Reset the elapsed time timer.
   * @param {string} [name='elapsed'] Allows multiple timers to be run at the same time, or just
   *   use the default timer.
   * @return {Logger} Self
   */
  resetElapsed(name: string) {
    name || (name = 'elapsed');
    this._timer || (this._timer = {});
    this._timer[name] = new Date().getTime();
    return this;
  }

  /**
   * Adds the High Resolution response time to the data column. This value is measured from when
   * the request is received. It is added to the request object by the reqId middleware module.
   * @param {string} [key=elapsed] Name of property in the data column.
   * @return {Logger} Self.
   */
  hrElapsed(key: string) {
    return this._setData('logData', key || 'elapsed', this.getHrElapsed());
  }

  /**
   * High resolution response time. This value is measured from when the request is received.
   * Returns the response time in milliseconds with two digits after the decimal.
   * @return {number} Response time in milliseconds
   */
  getHrElapsed() {
    if (this._ctx) {
      let val;
      if (this._ctx._hrStartTime) {
        val = this._ctx._hrStartTime;
      } else if (this._ctx && this._ctx.state && this._ctx.state.hrStartTime) {
        val = this._ctx.state.hrStartTime;
      } else if (this._ctx.req && this._ctx.req._hrStartTime) {
        val = this._ctx.req._hrStartTime;
      }
      if (val) {
        let parts = process.hrtime(val);
        return (parts[0] * 100000 + Math.round(parts[1] / 10000)) / 100;
      }
    }
    return 0;
  }

  get logLevel() : LogLevelValue {
    return this._logMgr._logLevels.levelThreshold;
  date(d: Date, s: string) {
    if( this._log)
    if (this.isAboveLevel(this._logMgr.LEVEL_INFO)) {
      d || (d = new Date());
      this.logAction = s || 'currentTime';
      this.data({
        localtime: moment(d).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        utctime: d.toISOString(),
        uptime: format.formatMS(d - this._logMgr.getStartTime())
      });
      this.logArgs(this._logMgr.LEVEL_INFO, []);
    }
    return this;
  }

  // Helper, level must be set, args must be an array, but can be empty
  logArgs(level: string, args: any[]) {
    if (!args.length) {
      args.unshift('');
    } else if (args.length && (args[0] === undefined || args[0] === null)) {
      args.shift();
    }
    args.unshift(level);
    return this.log.apply(this, args);
  }

  /**
   * Output a log message, specifying the log level as the first parameter, and a string
   * with util.format syntax as a second parameter,
   * for example myLogger.log('info', 'test message %s', 'my string');
   * The second parameter can optionally be an array of strings or arrays, each one of which
   * will be treated as input to util.format. This is useful for logMgrs that support
   * folding (muli-line output).
   * Example: log.log( 'info', [["Found %d lines", iLines],"My second line",["My %s
   * line",'third']]); );
   * @param {string} [level=info] - One of Logger.LEVEL_ORDER. Defaults to `info` if not present.
   * @param {string} msg - The message String, or an array of strings, to be formatted with
   *   util.format.
   */
  log(level: string, msg: string) {
    let args = Array.prototype.slice.call(arguments);
    if (args.length) {
      if (args.length === 1) {
        args.unshift(this._logMgr.LEVEL_INFO);
      }
      if (this.isAboveLevel(args[0])) {
        this._writeMessage.apply(this, args);
      }
    }
    return this;
  }

  /**
   * Calls the logMgr interface to output the log message.
   * Rolls in all previous calls to set data and action, and resets those values.
   * @param {string} level - Must be one of LogManager.LEVEL_ORDER
   * @param {(...string|...string[])} msg - Normally a string, providing the same string
   * interpolation format as util.format. May also be an array of strings,
   * in which case each entry in the array is treated as arguments to util.format.
   * This later situation is useful for logMgrs that support multi-line formatting.
   * @private
   */
  _writeMessage(level: string, msg: string) {
    let args = Array.prototype.slice.call(arguments);
    if (args.length > 1) {
      let params = {
        level: args.shift(),
        emitter: this._stack.join('.')
      };
      if (this.logData) {
        params.data = this.logData;
        delete this.logData;
      }
      if (this.staticData) {
        params.static = this.staticData;
      }
      if (this.logAction) {
        params.action = this.logAction;
        delete this.logAction;
      }
      if (this.truncateLength) {
        params.length = this.truncateLength;
        delete this.truncateLength;
      }
      if (args.length === 1 && args[0] instanceof Array) {
        params.message = [];
        for (let idx = 0; idx < args[0].length; ++idx) {
          params.message.push(
            util.format.apply(this, args[0][idx] instanceof Array ? args[0][idx] : [args[0][idx]])
          );
        }
      } else if (args && args.length) {
        if (typeof args[0] === 'string') {
          params.message = util.format.apply(this, args);
        } else {
          let arr = [];
          args.forEach(function (arg) {
            arr.push(JSON.stringify(arg));
          });
          params.message = arr.join(' ');
        }
      }
      if (this._ctx) {
        this.logParams(params);
      } else {
        if (this._silent !== true) {
          this._logMgr.logParams(params, this.logLevel);
        }
      }
    }
  }

  /**
   * Log a raw message in the spirit of Logger.logMessage, adding sid and reqId columns from
   * this._ctx.req Looks for sessionID in req.session.id or req.sessionId, otherwise uses the
   * passed in values for sid and reqId (if any). This is the method that calls the underlying
   * logging outputter. If you want to use your own logging tool, you can replace this method, or
   * provide your own transport.
   * @param params
   * @return {*}
   */
  logParams(params: any) {
    function setParams(ctx: any) {
      if (ctx._reqId) {
        params.reqId = ctx._reqId;
      } else if (ctx.reqId) {
        params.reqId = ctx.reqId;
      }
      if (ctx.session && ctx.session.id) {
        params.sid = ctx.session.id;
      } else if (ctx.sessionId) {
        params.sid = ctx.sessionId;
      } else if (ctx.sid) {
        params.sid = ctx.sid;
      }
    }

    if (this._ctx) {
      if (this._ctx.state && this._ctx.app) {
        // Attempt to determine if this is a koa context
        setParams(this._ctx);
      } else if (this._ctx.req) {
        // Must be an express context
        setParams(this._ctx.req);
      } else {
        setParams(this._ctx);
      }
    }
    if (this._silent !== true) {
      this._logMgr.logMessage(params);
    }
    return this;
  }

  setTruncate(len: number) {
    this.truncateLength = len;
    return this;
  }

  /**
   * Set the log level for this object. This overrides the global log level for this object.
   * @param {string} level - Must be one of LogManager.LEVEL_ORDER.
   * @return {Logger} Self
   */
  setLevel(level: LogLevelValue) {
    this._level = level;
    return this;
  }

  /**
   * Get the log level for this object
   * @returns {string} The currently set log level for this Logger object.
   */
  getLevel(): LogLevelValue {
    return this._level;
  }

  /**
   * Test if the given level is above the log level set for this Logger object.
   * @param {string} level - Must be one of LogManager.LEVEL_ORDER.
   * @return {boolean} True if the level is equal to or greater then the reference, or if
   *   reference is null.
   */
  isAboveLevel(level: string) {
    let reference = this._level || this._logMgr.logLevel;
    if (this._logMgr.LEVEL_ORDER.indexOf(level) >= this._logMgr.LEVEL_ORDER.indexOf(reference)) {
      return true;
    }
    return false;
  }
}

export type LoggerInstance = Logger & {
  [key in LogLevelName]: (...args: any[]) => LogMsgBuilder; // Ensure dynamic methods return LoggerInstance
};
