# Logger #

Jim's logger module. Includes support for logging to either the console or
[SOS Max](http://www.sos.powerflasher.com/developer-tools/sosmax/home/).
_"The SOS max is the POWERFLASHER Socket Output Server - a fast and helpful programmer tool with graphical
user interface to display log messages for debugging purpose."_

```javascript
var log = require('logger').get('filename');

log.info("Return value for %s is %s", "hello", "world" );

log.log('info',["A multiline","output"]);
```
