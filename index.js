/*****************************************************************************
 * log_listener.js.js
 * CONFIDENTIAL Copyright 2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/


var self = {

    /**
     * Global LogManager singleton
     */
    _gLogManager: undefined,

    /**
     * @return {LogManager} class. Use this class to create your own LogManager if you don't
     * want a global LogManager.
     * @ignore
     */
    LogManager: require('./src/log_mgr'),

    /**
     * @return {Logger} class
     * @ignore
     */
    Logger: require('./src/logger'),

    /**
     * Return the global LogManager singleton. Will create the singleton if it does not already
     * exist.
     * @param options
     * @returns {LogManager} Existing or new global LogManager object
     */
    getLogManager: function (options) {
        if (!self._gLogManager) {
            self._gLogManager = new self.LogManager(options);
        }
        return self._gLogManager;
    },

    /**
     * Test if the global LogManager singleton has been initialized
     * @returns {boolean} Do we have a global LogManager singleton?
     */
    hasLogManager: function () {
        return self._gLogManager ? true : false;
    },

    /**
     * Get a Logger object upon which logging calls can be made.
     * @param name {string|string[]} Name of module. If an array, then joined by '.'.
     * @param context {Object} Context object, with optional req and res properties.
     * @returns {Logger} New Logger object
     */
    getLogger: function (name, context) {
        return self.getLogManager().getLogger(name, context);
    },

    /**
     * Unit test helper can be used in conjunction with callback transport.
     * @param options
     * @returns {LogListener}
     */
    getLogListener: function (options) {
        var LogListener = require('./src/log_listener');
        return new LogListener(options);
    },

    /**
     * Shortcut to calling the global LogManager's start method.
     * @see {@link LogManager#start}
     * @returns {LogManager}
     */
    start: function () {
        return self.getLogManager().start();
    },

    /**
     * Utility formatting routines
     */
    format: require('./src/format'),

    /**
     * @deprecated
     */
    hasLogMgr: function () {
        return self.hasLogManager();
    },

    /**
     * @deprecated
     */
    logMgr: function (options) {
        return self.getLogManager(options);
    },

    /**
     * @deprecated
     */
    get: function (name, context) {
        return self.getLogger(name, context);
    },

    /**
     * @deprecated
     */
    logListener: function (options) {
        return self.getLogListener(options);
    },

    /**
     * Return Express Middleware.
     * @example
     * var reqId = require('epdoc-logger').middleware().reqId;
     * app.use(reqId());
     */

    middleware: function () {
        return {
            reqId: require('./src/middleware/reqId'),
            responseLogger: require('./src/middleware/response_logger'),
            routeLogger: require('./src/middleware/route_logger'),
            routeSeparator: require('./src/middleware/route_separator'),
            errorHandler: require('./src/middleware/error_handler')
        };
    },

    /**
     * Return Koa2 Middleware. Requires node7.
     * @example
     * var reqId = require('epdoc-logger').koa().requestId;
     * app.use(requestId());
     */

    koa: function () {
        return {
            requestId: require('./src/koa/request_id'),
            requestLogger: require('./src/koa/request_logger'),
            routeInfo: require('./src/koa/route_info'),
            routeSeparator: require('./src/koa/route_separator')
        };
    }

};

module.exports = self;
