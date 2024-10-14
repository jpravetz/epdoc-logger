import { type Dict, type Integer, isNonEmptyArray, isNonEmptyString } from '@epdoc/typeutil';
import type { AppTimer } from './app_timer.ts';
import type { LogLevel, LogLevels, LogLevelValue } from './levels.ts';
import type { LogMgr } from './logmgr.ts';
import type { MsgBuilder } from './msg-builder.ts';
import type { LogContextParams, LogMessage, LogMessageConsts } from './types.ts';

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
 * @param  {LogMgr} logMgr - The parent LogManager object that specifies the transport and
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
  protected _logMgr: LogMgr;
  // protected _separatorOpts: SeparatorOpts;
  protected _name: string;
  protected _ctxParams: LogContextParams = {};
  protected _reqId: string;
  protected _sid: string;
  protected _emitter: string[];
  // protected _ctx: Dict;
  // protected _style: Style;
  protected _level: LogLevelValue;
  // protected bErrorStack: boolean;
  protected _logData: object;
  protected _logAction: string;
  protected _stack: string[] = [];
  protected _initialized: boolean = false;
  protected _line: MsgBuilder;
  protected _msg: LogMessage = {};
  protected _silent: boolean;
  protected _truncateLength: Integer;
  protected _timer: AppTimer;
  protected _msgConsts: LogMessageConsts = { emitter: [] };

  constructor(logMgr: LogMgr) {
    this._logMgr = logMgr;
  }

  setLogMgr(val: LogMgr): this {
    if (val) {
      this._logMgr = val;
    }
    return this;
  }

  // timer(timer?: AppTimer | true): this {
  //   if (timer === true) {
  //     this._timer = new AppTimer();
  //   } else if (timer instanceof AppTimer) {
  //     this._timer = timer;
  //   } else {
  //     this._timer = this._logMgr.appTimer;
  //   }
  //   return this;
  // }

  emitter(val: string): this {
    if (isNonEmptyString(val)) {
      this._emitter.push(val);
      this._stack = this._emitter;
    } else if (isNonEmptyArray(val)) {
      this._emitter.concat(val);
      this._stack = this._emitter;
    }
    return this;
  }

  context(ctx: any): this {
    this.setContextParams(this._ctxParams, ctx);
    return this;
  }

  msgBuilder(builder: MsgBuilder): this {
    if (builder) {
      this._line = builder;
    }
    return this;
  }

  set silent(val: boolean) {
    this._silent = val;
  }

  get silent(): boolean {
    return this._silent;
  }

  public resolve(): this {
    if (!this._logMgr) {
      throw new Error('Log Manager not configured');
    }
    if (this._line) {
      this._line.logManager(this._logMgr).emitter(this._emitter.join('.')).contextParams(this._ctxParams);
    }
    return this;
  }

  get name() {
    return 'Logger#' + (this._emitter as string[]).join('.');
  }

  get logMgr(): LogMgr {
    return this._logMgr;
  }

  get logLevels(): LogLevels {
    return this._logMgr.logLevels;
  }

  level(level: LogLevel, ...args: unknown[]): MsgBuilder {
    if (this._initialized) {
      const unemitted = this._line.partsAsString();
      throw new Error(`Emit the previous log message before logging a new one: ${unemitted}`);
    }
    const msgConsts: LogMessageConsts = {};
    // const opts: LoggerLineOpts = {
    //   reqId: this._reqId,
    //   sid: this._sid,
    //   logLevels: this._logLevels,
    //   separatorOpts: this._separatorOpts
    // };
    return this._line
      .clear()
      .setLevel(level)
      .setInitialString(...args);
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
   * Log a raw message in the spirit of Logger.logMessage, adding sid and reqId columns from
   * this._ctx.req Looks for sessionID in req.session.id or req.sessionId, otherwise uses the
   * passed in values for sid and reqId (if any). This is the method that calls the underlying
   * logging outputter. If you want to use your own logging tool, you can replace this method, or
   * provide your own transport.
   * @param params
   * @return {*}
   */
  setContextParams(params: any, ctx: Dict) {
    function setParams(context: any) {
      if (context._reqId) {
        params.reqId = context._reqId;
      } else if (ctx.reqId) {
        params.reqId = context.reqId;
      }
      if (context.session && context.session.id) {
        params.sid = context.session.id;
      } else if (context.sessionId) {
        params.sid = context.sessionId;
      } else if (context.sid) {
        params.sid = context.sid;
      }
    }

    if (ctx) {
      if (ctx.state && ctx.app) {
        // Attempt to determine if this is a koa context
        setParams(ctx);
      } else if (ctx.req) {
        // Must be an express context
        setParams(ctx.req);
      } else {
        setParams(ctx);
      }
    }
    // if (this._silent !== true) {
    //   this._logMgr.logMessage(params);
    // }
    return this;
  }

  setTruncate(len: number): this {
    this._truncateLength = len;
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
   * Log a separator line at the info level. This is equivalent to calling log.info().separator().emit()
   * @param {LogLevelName|LogLevelValue} [level=info] - The log level at which to log the separator.
   * @return {Logger}
   */
  // separator(msg: LogMessage) {
  //   msg.level = msg.level ?? this.logLevels.asValue('info');
  //   if (this.logLevels.meetsThreshold(msg.level)) {
  //     msg.separator = true;
  //     this._logMgr.logMessage(msg);
  //   }
  //   return this;
  // }
}
