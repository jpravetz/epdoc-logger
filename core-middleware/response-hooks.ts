/**
 * Express.js methods that are either added to or replace methods of the Express response object.
 * @module Response
 */

export const ExpressResponseHooks = {
  /**
   * Replace express's ```send``` method with our own, so that we can output a log message, but
   * then call the parent (```res```) object's ```send``` to finish the job. Will trap calls to
   * ```res.json()``` and prevent those from recalling ```res.send()```.
   *
   * Attaches a private property ```_origSendCalled``` to the ```Response``` object. Also expects
   * the Response object's original ```send``` method to have been renamed to ```_origSend```.
   *
   * @param body Response body.
   * @returns this
   */
  send: function (body) {
    const res = this;
    const req = this.log.ctx.req;
    const log = this.log;

    log.data({ status: this.statusCode }).hrElapsed('responseTime');
    if (res._delayTime) {
      log.data('delay', res._delayTime);
    }
    // If you want to log more properties you can add them to res._logSendData
    if (res._logSendData) {
      Object.keys(res._logSendData).forEach(function (key) {
        log.data(key, res._logSendData[key]);
      });
    }

    if (!res._origSendCalled) {
      log.action('response.send')._info();
    }
    // Trap case where res.json is called, which will result in res.send being called again
    if (typeof body === 'object' && body !== null && !Buffer.isBuffer(body)) {
      // settings
      const app = req.app;
      const replacer = (app && app.get('json replacer')) || null;
      const spaces = (app && app.get('json spaces')) || '  ';
      const s = JSON.stringify(body, replacer, spaces);

      // content-type
      if (!res.get('Content-Type')) {
        res.set('Content-Type', 'application/json');
      }
      res._origSendCalled = true;
      return res._origSend(s);
    } else {
      res._origSendCalled = true;
      return res._origSend.apply(this, arguments);
    }
  },

  /**
   * Replace express's ```end``` method with our own, so that we can output a log message, but
   * then call the parent (```res```) object's ```end``` to finish the job. Will not output a log
   * message if this was called from ```res.send()```.
   *
   * Expects
   * the Response object's original ```end``` method to have been renamed to ```_origEnd```.
   *
   * @returns this
   */
  end: function (body) {
    let res = this;
    if (!res._origSendCalled) {
      this.log.data({ status: this.statusCode }).hrElapsed('responseTime');
      if (res._delayTime) {
        this.log.data('delay', res._delayTime);
      }
      this.log.action('response.end')._info();
    }
    return this._origEnd.apply(this, arguments);
  },

  /**
   * Delay time is a field you can set manually to indicate a process has been 'paused' for whatever
   * reason, perhaps to back off on processing too many requests at the same time, or to
   * randomize password verification response time (the later being for security reasons). This value
   * can be inserted in log messages.
   *
   * @example
   *  log.data({delay:res.delayTime()}).info("Response delayed for password verification randomization")
   *
   * @returns {number} Delay time in milliseconds
   */
  delayTime: function () {
    return this._delayTime;
  },
};
