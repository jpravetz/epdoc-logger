## Koa2 Integration

The included koa2 middleware are instantiated as follows:

```typescript
import { Koa2Middleware } from '@epdoc/logger';
let middleware = new Koa2Middleware({});

import * as Koa from "koa";
const app = new Koa()

let app = new Koa();
app.use(middleware.requestId());
app.use(app.router);
app.all('*', middleware.requestLogger());
app.all('*', middleware.routeSeparator());
app.all('*', middleware.routeInfo());
```


```typescript
let middleware = require('epdoc-logger').koa();

let app = koa();
app.use(middleware.requestId());

app.use(app.router);
app.all('*', middleware.requestLogger());
app.all('*', middleware.routeSeparator());
app.all('*', middleware.routeInfo());
```

For details, refer to the similarily-named modules that are used for [express](./express.md), or the source code.
