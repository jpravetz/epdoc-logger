## Log Levels

### Definition

Log levels are defined in a [LogLevels](../src/log-levels.ts) object that you must initialize with the log levels supported in your application. If you do not specify your own LogLevels object, then this default set of log levels is used: 

```typescript
export const logLevelDefs: LogLevelDef = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  debug: 5,
  prompt: 6,
  verbose: 7,
  input: 8,
  silly: 9
} as const;

export type LogLevelName = keyof typeof logLevelDefs;
export type LogLevelValue = Integer;
```

There is a [Logger](./classes#logger-class) method for each log level.

You specify a log level for a log message by calling the corresponding method,
for example the following will emit a message with the log level set to INFO:

```typescript
log.info('An info message').emit();
```

The `info` method returns an object (`MsgBuilder`) that is used to build the
message and must be the first method called when asking `log` to create a new
log message.


You can also begin a log message by calling the logger's line method, passing
the log level into this method.

```typescript
log.debug('a debug message').emit();

// is equivalent to 

log.line('debug').plain('a debug message').emit();
```

### Customization

Refer to the [section on customization](./cutomization.md) for an overall
picture of how to customize this package.

Essentially what you must do is create a file similar to the [default log level
configuration file](../src/default/logger.ts), and reference it in your
project rather than the default configurations.

Use lowercase when defining your log levels (e.g. use 'info', not 'INFO').

### Threshold

There are two thresholds that apply across all emitted log messages:
 - logThreshold - the threshold that filters which log messaages to emit
 - ~~errorStackThreshold - the threshold that determines at which log level an error stack message is output~~



