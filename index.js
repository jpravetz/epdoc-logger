/**
 * Returns an epdoc-logger singleton to expose classes and objects from the epdoc-logger module.
 */


var self = {

    /**
     * Global LogManager singleton
     */
    _gLogManager: undefined,

    /**
     * @return {LogManager} class
     */
    LogManager: require('./src/log_mgr'),

    /**
     * @return {Logger} class
     */
    Logger: require('./src/logger'),

    /**
     * Return the global LogManager singleton. Will create the singleton if it does not already
     * exist.
     * @param options
     * @returns {LogManager} Existing or new global LogManager object
     */
    logMgr: function (options) {
        if (!self._gLogManager) {
            self._gLogManager = new self.LogManager(options);
        }
        return self._gLogManager;
    },

    /**
     * Test if the global LogManager singleton has been initialized
     * @returns {boolean} Do we have a global LogManager singleton?
     */
    hasLogMgr: function () {
        return self._gLogManager ? true : false;
    },

    /**
     * Shortcut to calling the global LogManager's start method.
     * @see {@link LogManager#start}
     * @returns {LogManager}
     */
    start: function () {
        return self.logMgr().start();
    },

    /**
     * Get a Logger object upon which logging calls can be made.
     * @param name {string|string[]} Name of module. If an array, then joined by '.'.
     * @param context {Object} Context object, with optional req and res properties.
     * @returns {Logger} New Logger object
     */
    get: function (name, context) {
        return self.logMgr().get(name, context);
    },

    /**
     * Return Express Middleware.
     * @example
     * var reqId = require('logger').middleware().reqId;
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
     * This module is not stable
     */
    Response: require('./src/stubs/response'),

    /**
     * This module is not stable
     */
    Request: require('./src/stubs/request')
};

module.exports = self;
