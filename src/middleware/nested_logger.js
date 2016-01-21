/*************************************************************************
 * Copyright(c) 2012-2016 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/

var util = require('util');
_ = require('underscore');
var logger = require('../../index').logger();
var DateUtil = require('../dateutil');

/**
 * Middleware extends express.js response object, to be used for logging and responding to API calls.
 * This middleware creates a new NestedLogger object with attached methods, then adds these methods
 * to the Express response object (mixins).
 */


/**
 * Our mixins that we add to the response object that provide logging and response methods.
 * Most logging methods can be chained. State is added to a _logging property that is added to the response object.
 * For example, the action state is stored as res._logging.action. The full list of _logging state properties
 * is:
 *      action - The 'action' column value when outputting to log.
 *      stack - Pushed and popped using pushRouteInfo and popRouteInfo methods. Should be string parts that
 *          are separated by '.'. The full stack is concatenated with '.' when output to log as the 'module' column.
 *      message - The text 'message' that will be output to log
 *      data - The 'data' column of the log output, can be set with logObj
 *      length - Set to truncate the overall length of the log output message
 *      resData - The data to be returned in the express response, and also output to log when calling send().
 *      resLogData - An alternative value to resData that is to be output to log, if resData is too large to be logged
 *      params -
 *      errorCode - An internal errorCode to be included in response object, maps to JSON API error.code
 */
var NestedLogger = function(req) {
    this.req = req;
    this.stack = [];
};

NestedLogger.prototype = {

    constructor: NestedLogger,

    /**
     * The time used since this res object was initialized by Express.
     * @returns {number}
     */
    responseTime: function() {
        return this.req._startTime ? ( new Date() - this.req._startTime ) : 0;
    },

    /**
     * High resolution response time.
     * Returns the response time in milliseconds with two digits after the decimal.
     * @returns {number} Response time in milliseconds
     */
    hrResponseTime: function() {
        if( this.req._hrStartTime ) {
            var parts = process.hrtime(this.req._hrStartTime);
            return ( parts[0] * 100000 + Math.round(parts[1] / 10000) ) / 100;
        }
        return 0;
    },


    /**
     * A method to add context to the method stack that has gotten us to this point in code.
     * The context is pushed into a stack, and the full stack is output as the 'module' property
     * of the log message.
     * Usually called at the entry point of a function.
     * Can also be called by submodules, in which case the submodules should call popRouteInfo when returning
     * Note that it is not necessary to call popRouteInfo when terminating a request with a response.
     * @param name (required) String in the form 'api.org.create' (route.method or route.object.method).
     * @return Response object
     */
    pushRouteInfo: function( name ) {
        this.stack.push(name);
        return this;
    },

    /**
     * See pushRouteInfo. Should be called if returning back up a function chain. Does not need to be
     * called if the function terminates the request with a response.
     * @param options Available options are 'all' if all action contexts are to be removed from the stack.
     * @return Response object
     */
    popRouteInfo: function( options ) {
        if( options && options.all === true ) {
            this.stack = [];
        } else {
            this.stack.pop();
        }
        return this;
    },

    /**
     * Logging method, takes string that can be formatted, or an array of strings.
     * Each of these calls will result in a log message being output.
     * @param msg
     * @return Response object
     */
    verbose: function( msg ) {
        return this.logArgs('verbose', Array.prototype.slice.call(arguments));
    },

    info: function( msg ) {
        return this.logArgs('info', Array.prototype.slice.call(arguments));
    },


    debug: function( msg ) {
        return this.logArgs('debug', Array.prototype.slice.call(arguments));
    },

    warn: function( msg ) {
        return this.logArgs('warn', Array.prototype.slice.call(arguments));
    },

    fatal: function( msg ) {
        return this.logArgs('fatal', Array.prototype.slice.call(arguments));
    },

    error: function( msg ) {
        // res._logging.message = util.format.apply(this,arguments);
        return this.logArgs('error', Array.prototype.slice.call(arguments));
    },

    logSeparator: function() {
        return this.logArgs('info', ["######################################################################"]);
    },

    logDate: function( d, s ) {
        d = d || new Date();
        return this.logObj({localtime: DateUtil.toISOLocalString(d), utctime: d.toISOString()}).info(s);
    },

    /**
     * Compose and output a log message using the previously set values for level, args, etc. that have been
     * set in res._logging.
     * @param level One of 'verbose', 'debug', 'info', 'warn', 'error', 'fatal'
     * @param args Can be (i) array of strings that are to be formatted into a string,
     * (e.g. ["Hello %s", 'world']), (ii) a length 1 array of arrays of arrays intended for multi-line output (where supported)
     * where each subarray is to be formatted (e.g. [[["Hello %s", 'world'],["Goodbye"]]]),
     * (iii) an array of objects where the first array entry is not an array or string (e.g. [{a:b,c:4},{e:5}])
     * @return The response object, for chaining
     */
    logArgs: function( level, args ) {
        var params = {
            level: level,
            module: this.stack.join('.')
        };
        if( this.truncateLength ) {
            params.length = this.truncateLength;
            delete this.truncateLength;
        }
        if( this.data ) {
            params.data = this.data;
            delete this.data;
        }
        if( this.action ) {
            params.action = this.action;
            delete this.action;
        }
        if( this.req._reqId ) {
            params.reqId = this.req._reqId;
        }
        if( args && args.length === 1 && (args[0] instanceof Array) ) {
            params.message = [];
            for( var idx = 0; idx < args[0].length; ++idx ) {
                params.message.push(util.format.apply(this, (args[0][idx] instanceof Array) ? args[0][idx] : [args[0][idx]]));
            }
        } else if( args && args.length ) {
            if( typeof args[0] === 'string' ) {
                params.message = util.format.apply(this, args);
            } else {
                var arr = [];
                args.forEach(function( arg ) {
                    arr.push(JSON.stringify(arg));
                });
                params.message = arr.join(' ');
            }
        }
        return this.logMessage(params);
    },

    setTruncate: function( len ) {
        this.truncateLength = len;
        return this;
    },

    /**
     * Log a raw message in the spirit of logger.logMessage, adding sessionID.
     * Looks for sessionID in req.session.id or req.sessionId, otherwise uses the passed in value (if any).
     * This is the method that calls the underlying logging outputter. If you want to use your own logging tool,
     * you can replace this method, or provide your own transport.
     * @param params
     * @return {*}
     */
    logMessage: function( params ) {
        if( this.req && this.req.session && this.req.session.id ) {
            params.sid = this.req.session.id;
        } else if( this.req && this.req.sessionId ) {
            params.sid = this.req.sessionId;
        }
        logger.logMessage(params);
        return this;
    },

    /**
     * Set the user-facing message that is to be used in an error or success response object
     * when calling success or fail. Will localize using req.i18n object if present.
     * If you are passing an already localized string, then do not use this method.
     * @param sprintf string followed by sprintf parameters
     * @return {*}
     */
    message: function() {
        this.message = this.req.i18n ? this.req.i18n.__.apply(this.req.i18n, arguments) : util.format.apply(this, arguments);
        return this;
    },

    // For weird situations, when we want to use the formatter, then get the string back
    getMessage: function() {
        return this.message;
    },

    /**
    /**
     * Action is a unique column in the log output and is a machine-searchable verb that uniquely describes the type of log event.
     * arguments String or comma separated list of strings that are then joined with a '.'
     * @returns {*}
     */
    action: function() {
        if( arguments[0] instanceof Array ) {
            this.action = arguments[0].join('.');
        } else if( arguments.length > 1 ) {
            this.action = Array.prototype.join.call(arguments, '.');
        } else {
            this.action = arguments[0];
        }
        return this;
    },

    /**
     * Log a key,value or an object. If an object the any previous logged objects
     * are overwritten. If a key,value then add to the existing logged object.
     * Objects are written when a call to info, etc is made
     * @param key If a string or number then key,value is added, else key is added
     * @param value If key is a string or number then data.key is set to value
     * @return The response object, for chaining
     */
    logObj: function( arg0, arg1 ) {
        if( typeof arg0 === 'string' || typeof arg0 === 'number' ) {
            if( !this.data ) {
                this.data = {};
            }
            this.data[arg0] = arg1;
        } else {
            this.data || ( this.data = {} );
            this.data = _.extend(this.data, arg0);
        }
        return this;
    },

    /**
     * Data to be included in a response's built error or success object.
     * Can also be set as a parameter in res.success.
     * Note: For Express, if you want to respond with a specific json object, use res.json().
     */
    data: function( data ) {
        this.resData = data;
        return this;
    },

    /**
     * Set an alternate 'data', to be output with logging messages. Use if data is not suitable for logging, for
     * example if too big to output or if data contains passwords.
     */
    logData: function( data ) {
        this.resLogData = data;
        return this;
    },

    /**
     * Can use to add arbitrary properties to the top-level response object
     * Example is to add meta, links or included properties to a JSON API response.
     * See http://jsonapi.org/format/#document-structure-top-level
     * @param name {String|Object} If an object then this.params is extended with this object
     * @param value
     * @return {*}
     */
    respParams: function( name, value ) {
        if( !this.params ) {
            this.params = {};
        }
        if( _.isString(name) ) {
            this.params[name] = value;
        } else if( _.isObject(name) ) {
            this.params = _.extend(this.params, name);
        }
        return this;
    },

    setParam: function( name, value ) {
        this.respParams(name, value);
    },

    /**
     * Can use to add arbitrary properties to the error object, in the event of an error
     * Example is to add validation errors using name 'validation'
     * @param name {String|Object} If an object then _logging.errorParams is extended with this object
     * @param value
     * @return {*}
     */
    errorParams: function( name, value ) {
        if( !this.errorParams ) {
            this.errorParams = {};
        }
        if( _.isString(name) ) {
            this.errorParams[name] = value;
        } else if( _.isObject(name) ) {
            this.errorParams = _.extend(this.errorParams, name);
        }
        return this;
    },

    /**
     * Set the errorCode to use in an error response object when calling res.fail.
     * Can be chained.
     * @param errorCode
     * @returns {NestedLogger}
     */
    errorCode: function( errorCode ) {
        this.errorCode = errorCode;
        return this;
    },

    /**
     * @deprecated
     * See res.errorCode. This is maintained for backward compatibility.
     * @param errorId
     * @return {*}
     */
    errorId: function( errorId ) {
        return this.errorCode(errorId);
    },

};


/**
 * Export a function that will cause the express res object to inherit from NestedLogger
 * @param opt_options {Object}
 *      responseBuilder: a method to build the response object in the event of an exception, error or success.
 *          Errors are indicated by the exception being passed in to the builder, or errorCode being defined.
 *          The value may be a function or 'json-api' to use the JSON API response builder.
 *      logger: {string} the name of an object to mixin our responseLogger methods with, rather than adding them
 *          directly to the response object.
 * @returns {Function}
 */

module.exports = function( opt_options ) {

    var options = opt_options || {};

    return function( req, res, next ) {

        // Add a privately used state object added to the res object to track state when method chaining.
        // The 'stack' property is used internally by pushRouteInfo and popRouteInfo.
        res._logging = {
            stack: []
        };

        // We need the super's send method
        res._origSend = res.send;

        // We need the super's send method
        res._origEnd = res.end;

        if( _.isString(options.logger) ) {
            res[options.logger] = {};
            // Add all the methods directly to the response object
            for( var funcName in NestedLogger ) {
                res[options.logger][funcName] = NestedLogger[funcName];
            }
        } else {
            // Add all the methods directly to the response object
            for( var funcName in NestedLogger ) {
                res[funcName] = NestedLogger[funcName];
            }
        }

        // Can override function that generates response object
        if( typeof options.responseBuilder === 'function' ) {
            res._responseBuilder = options.responseBuilder;
        } else if( options.responseBuilder === 'json-api' ) {
            res._responseBuilder = resUtil.jsonApiResponseBuilder;
        } else {
            res._responseBuilder = resUtil.defaultResponseBuilder;
        }

        next();
    }
};

