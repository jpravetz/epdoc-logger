import { Milliseconds } from '@epdoc/timeutil';
import * as Koa from 'koa';

export interface Context extends Koa.Context {
  _reqId: number;
  state: State;
}

export interface State extends Koa.DefaultState {
  hrStartTime: [number, number];
  startTime: Milliseconds;
  _delayTime: Milliseconds;
}
