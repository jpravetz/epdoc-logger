## Express Middleware

[Express](http://expressjs.com/) middleware extends express.js
[response](http://expressjs.com/en/4x/api.html#res) object by adding a
`Logger` object via which logging can be done in the context of the request. Also extends
[response.send](http://expressjs.com/en/4x/api.html#res.send) and
[response.end](http://expressjs.com/en/4x/api.html#res.send) methods to automatically
log a message when a response is sent. This message will include the response time for the
request.


The included express middleware is instantiated as follows:

```typescript
import expressDefaults as express from '@epdoc/logger'
let middleware = require('epdoc-logger').middleware();

let app = express();
app.use(express.middleware.reqId());

app.use(app.router);
app.all('*', express.middleware.responseLogger());
app.all('*', express.middleware.routeSeparator());
app.all('*', express.middleware.routeLogger());
```

See test/app.express.js for an example of how to use a stub request and response
method to test middleware. This technique can also be useful if you wish to use
the req/res/next mechanism in non-express environments. As an example, you could
have req/res objects for tracking AMQP (RabbitMQ) or AWS SQS requests and
associating request or session IDs.

### ReqId

Adds `_reqId` and `_hrStartTime` to the request object. These are used later
when logging.

### ResponseLogger

The responseLogger middleware mixes custom logging methods, similar to those in
the logging object, into the express `response` object. This will add
request-context-sensitive logging information to each log message.

As with the logging object, most methods can be chained. An example usage:

```typescript
function myFunction(req,res,params) {
    res.pushRouteInfo('myFunction');
    res.action('complete').data(params).info('Entering function');
    res.popRouteInfo();
}
```

### RouteSeparator

Adds a separator line to the log file for each new route.

### RouteLogger

Adds an information line to the log file for each new route.
