module.exports.Logger = require('./src/logger');

/**
 * Return Express Middleware
 * Usage:
 *      var reqId = require('logger').middleware().reqId;
 *      app.use(reqId());
 */

module.exports.middleware = function () {
    return {
        reqId: require('./src/middleware/reqId'),
        responseLogger: require('./src/middleware/responseLogger'),
        routeLogger: require('./src/middleware/routeLogger'),
        routeSeparator: require('./src/middleware/routeSeparator'),
        errorHandler: require('./src/middleware/errorHandler')
    };
};

module.exports.response = require('./src/stubs/response');
module.exports.request = require('./src/stubs/request');

