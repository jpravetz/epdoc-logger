import { Logger } from './logger.ts';

Deno.test('logger', () => {
  const log = new Logger();
  log.info.h1('header').emit('test');
  log.error.error('error').value('value').emit('test');
  log.verbose.error('error').value('value').emit('test');
});
