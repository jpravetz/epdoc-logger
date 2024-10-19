import { assertEquals } from '@std/assert';
import { MsgBuilder } from './builder.ts';

Deno.test('test', () => {
  const builder = new MsgBuilder();
  assertEquals(builder.emit('test'), 'test');
});
