var self = {
    
    _gLogger: undefined,

    Logger: require('./src/logger'),

    logger: function (options) {
        if (!self._gLogger) {
            self._gLogger = new self.Logger(options);
        }
        return self._gLogger;
    },

    get: function (name) {
        return self.logger().get(name);
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