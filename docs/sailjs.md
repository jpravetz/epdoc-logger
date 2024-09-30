## Sailsjs Integration

To add epdoc-logger middleware to a [sailsjs](http://sailsjs.org) application, add an `http.customMiddleware` function
to your config/http.js file as shown here.

```typescript
module.exports.http = {

  customMiddleware: function (app) {
    let middleware = require('epdoc-logger').middleware();
    app.use(middleware.reqId());
    app.all('*', middleware.responseLogger());
    app.all('*', middleware.routeSeparator());
    app.all('*', middleware.routeLogger());
  }
};
```

To replace the default CaptainsLog logger, add a `log.custom` property to your config/log.js file.
The log object that is returned by `getLogger()` implements all of the methods of the CaptainsLog
logger, with the exception of `silent` and `silly`.

```typescript
let elogger = require('epdoc-logger');
elogger.getLogManager();

module.exports.log = {
  custom: elogger.getLogger('app')
};
```

You'll also want to find a place to start the logger, and set the config so that autoRun is true.
This can be done in `app.js`.

```javacript
  let elogger = require('epdoc-logger');
  elogger.getLogManager(configOverrides.elogger);
```

The above does not add logging to socketio requests. 
Refer to examples/sails_request_logger.js to see how to log socket requests.
