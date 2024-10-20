import { assertEquals } from '@std/assert';
import { MsgBuilder, type ILogEmitter } from './builder.ts';

const emitter: ILogEmitter = {
  emit: () => {},
};

Deno.test('test', () => {
  const builder = new MsgBuilder('INFO', emitter);
  assertEquals(builder.emit('test'), 'test');
});
