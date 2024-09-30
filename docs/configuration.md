

## Configuration

The easiest way to use the logger is to create and initialize a
[LogManager](./src/log-manager.ts) object using config settings, then retrieve a
[Logger](./src/log-manager.ts) object from the LogManager.


```typescript
import { LogManager } from '@epdoc/logger';


let config = require('config');
let logMgr = elogger.getLogManager(config.elogger).start();
let log = logMgr.get('emitter.name.goes.here');

log.action('say.hello').set({static1:'value1'}).info("Hello world");
```

An example configuration, illustrating how transports are specified and configured.

```json
{
  "elogger": {
    "sid": true,
    "static": true,
    "transports": ["console"],
    "level": "info",
    "console": {
      "timestamp": "iso"
    },
    "loggly": {
      "token": "xxxxxxxx"
    }
  }
}
```

Refer to {@link LogManager#setOptions} method for config object documentation.

### Manual Configuration

Buffer messages until your logger is set up.

```typescript
let logMgr = require('epdoc-logger').getLogManager();
let log = logMgr.getLogger('main');
log.info("Starting application");

let config = require('config.json');
logMgr.setTransport('file',{path:config.logFile,timestamp:'iso'}).start(); 

log.info("Hello world");
```

```bash
["2016-03-29T04:19:45.920Z","INFO","main","","Starting application"]
["2016-03-29T04:19:45.922Z","INFO","logger","logger.push","Setting logger to File (/path/to/file.log)",{"transport":"File (/path/to/file.log)"}]
["2016-03-29T04:19:45.924Z","INFO","logger","logger.push.success","Set logger to File (/path/to/file.log)",{"transport":"File (/path/to/file.log)"}]
["2016-03-29T04:19:45.926Z","INFO","main","","Hello world"]
```

Log to [loggly.com](http://loggly.com), buffering and making batch calls to loggly.

```typescript
let logMgr = require('epdoc-logger').getLogManager();
let log = logMgr.getLogger('main');
log.info("Starting application");

logMgr.setTransport('loggly',{token:'MyToken'}); 

log.info("Hello world");

// log a message count for all the different log levels
logMgr.writeCount();

// Shutdown properly so loggly message buffer is flushed
logMgr.destroying().then(function() {
    done();
}, function(err) {
    done(err);
});

```

