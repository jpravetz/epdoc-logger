1.4.4 / 2013-02-14
==================

  * Add getCount and writeCount global methods

1.4.3 / 2013-02-02
==================

  * Added request unique ID to logging
  * Interface improvements and better JSON output

1.4.0 / 2013-01-30
==================

  * Added data property to Logger.logMessage and now output to file as JSON array

1.3.2 / 2013-01-29
==================

  * Added length property to Logger.logMessage so that caller can have messages
    truncated with ... if the message is over a certain length

1.3.0 / 2013-01-23
==================

  * Added bIncludeSid to options when setting logger
  * Removed support for passing in sessionId callback object, as we now support this in raw writeMessage method
  * Fixed raw writeMessage method so that it is filtered based on gLogLevel and time/timeDiff are auto populated

1.2.1 / 2013-01-22
==================

  * Added buffering option to file transport
  * Now support push/pop of transports on transport stack, with auto unshift when transport closes
  * Exposed raw writeMessage method for use by express response extension

1.1.2 / 2013-01-17
==================

  * Added log.fatal() method
  * Now allow null/undefined as first arg in log.log based methods

1.0.0 / 2013-01-15
==================

  * Added ability to pass in an object with a callback to return a session ID
