/*****************************************************************************
 * response.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/


/**
 * Expressjs mixin that provides logging and response methods.
 * These methods are added to the response object.
 * Most logging methods can be chained. State is added to a log property that is added to the response object.
 * For example, the action state is stored as res.log.action. The full list of log state properties
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

var Response = function () {
};

Response.prototype = {

    constructor: Response,

    /**
     * Replace express's res.send() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's send to finish the job. Will trap calls to res.json() and prevent
     * those from recalling res.send();
     * @returns this
     */
    send: function (body) {
        var res = this;
        var req = this.log.ctx.req;
        var log = this.log;

        var data = {status: this.statusCode, responseTime: this.log.getHrResponseTime()};
        if (res._delayTime) {
            data.delay = res._delayTime;
        }

        if (!res._origSendCalled) {
            log.action('response.send').data(data)._info();
        }
        // Trap case where res.json is called, which will result in res.send being called again
        if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
            // settings
            var app = req.app;
            var replacer = app && app.get('json replacer') || null;
            var spaces = app && app.get('json spaces') || '  ';
            var s = JSON.stringify(body, replacer, spaces);

            // content-type
            if (!req.get('Content-Type')) {
                req.set('Content-Type', 'application/json');
            }
            return res._origSend(s);
        }
        res._origSendCalled = true;
        return res._origSend.apply(this, arguments);
    },

    /**
     * Replace express's res.end() method with our own, so that we can add a couple of log messages, but then
     * call the parent (res) object's end to finish the job. Will not output a log message if this was called
     * from res.send().
     * @returns this
     */
    end: function (body) {
        var res = this;
        var log = this.log;
        if (!res._origSendCalled) {
            var data = {status: this.statusCode, responseTime: this.log.getHrResponseTime()};
            if (res._delayTime) {
                data.delay = res._delayTime;
            }
            this.action('response.end').data(data)._info();
        }
        return this._origEnd.apply(this, arguments);
    },

    /**
     * Delay time is a field you can set manually to indicate a process 'paused' for whatever reason, perhaps to
     * back off on processing too many requests at the same time, or to randomize password verification
     * response time (the later being for security reasons).
     * @returns {number} Delay time in milliseconds
     */
    delayTime: function () {
        return this._delayTime;
    }
};

module.exports = Response;
