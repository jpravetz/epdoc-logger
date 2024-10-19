import { cli } from '@scope/levels';
import { assertEquals } from '@std/assert';
import { MsgBuilder } from './builder.ts';

Deno.test('test', () => {
  const logLevels = cli.createLogLevels();
  const builder = new MsgBuilder(logLevels, 'info');
  assertEquals(builder.emit('test'), 'test');
});
