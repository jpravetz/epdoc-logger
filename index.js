var self = {
    
    _gLogManager: undefined,

    LogManager: require('./src/log_mgr'),

    logMgr: function (options) {
        if (!self._gLogManager) {
            self._gLogManager = new self.LogManager(options);
        }
        return self._gLogManager;
    },

    start: function() {
        return self.logMgr().start();
    },

    /**
     * Get a log object upon which logging calls can be made
     * @param name {string|Array} Name of module. If an array, then joined by '.'.
     * @param context {Object} Context object, with optional req and res properties.
     * @returns New Log object
     */
    get: function (name,context) {
        return self.logMgr().get(name,context);
    },

    /**
     * Return Express Middleware
     * Usage:
     *      var reqId = require('logger').middleware().reqId;
     *      app.use(reqId());
     */

    middleware: function () {
        return {
            reqId: require('./src/middleware/reqId'),
            responseLogger: require('./src/middleware/responseLogger'),
            routeLogger: require('./src/middleware/routeLogger'),
            routeSeparator: require('./src/middleware/routeSeparator'),
            errorHandler: require('./src/middleware/errorHandler')
        };
    },

    Response: require('./src/stubs/response'),
    Request: require('./src/stubs/request')
};

module.exports = self;