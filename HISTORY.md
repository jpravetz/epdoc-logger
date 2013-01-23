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
