import { Integer } from '@epdoc/typeutil';
import { Request, Response } from 'express';

export interface LoggerRequest extends Request {
  _reqId: Integer;
  _startTime: Date;
  _hrStartTime: [number, number];
  session?: { id: string };
}

export interface LoggerResponse extends Response {
  _origSend: Function;
  _origEnd: Function;
  delayTime: Function;
}

/**
 * [Express]{@link http://expressjs.com/} middleware extends express.js
 * [response]{@link http://expressjs.com/en/4x/api.html#res} object by adding a
 * {@link Logger} object via which logging can be done in the context of the request. Also extends
 * [response.send]{@link http://expressjs.com/en/4x/api.html#res.send} and
 * [response.end]{@link http://expressjs.com/en/4x/api.html#res.send} methods to automatically
 * log a message when a response is sent. This message will include the response time for the
 * request.
 *
 * @module middleware/responseLogger
 */
