import { assertEquals } from '@std/assert';
import { MsgBuilder } from './mod.ts';

Deno.test('test', () => {
  const builder = new MsgBuilder();
  assertEquals(builder.emit('test'), 'test');
});
Deno.test('display', () => {
  const builder = new MsgBuilder();
  const result = builder
    .h1('h1')
    .h2('h2')
    .h3('h3')
    .action('action')
    .label('label')
    .highlight('highlight')
    .value('value')
    .path('path')
    .date('date')
    .warn('warn')
    .error('error')
    .emit();
  console.log(result);
});
Deno.test('h1', () => {
  const builder = new MsgBuilder();
  const result = builder.h1('h1').emit();
  console.log(result);
  assertEquals(result, '\x1b[1m\x1b[35mh1\x1b[39m\x1b[22m');
});
Deno.test('h2', () => {
  const builder = new MsgBuilder();
  const result = builder.h2('h2').emit();
  console.log(result);
  assertEquals(result, '\x1b[35mh2\x1b[39m');
});
Deno.test('h3', () => {
  const builder = new MsgBuilder();
  const result = builder.h3('h3').emit();
  console.log(result);
  assertEquals(result, '\x1b[32mh3\x1b[39m');
});
Deno.test('action', () => {
  const builder = new MsgBuilder();
  const result = builder.action('action').emit();
  console.log(result);
  assertEquals(result, '\x1b[30m\x1b[43maction\x1b[39m\x1b[49m');
});
Deno.test('label', () => {
  const builder = new MsgBuilder();
  const result = builder.label('label').emit();
  console.log(result);
  assertEquals(result, '\x1b[34mlabel\x1b[39m');
});
Deno.test('highlight', () => {
  const builder = new MsgBuilder();
  const result = builder.highlight('highlight').emit();
  console.log(result);
  assertEquals(result, '\x1b[35mhighlight\x1b[39m');
});
Deno.test('value', () => {
  const builder = new MsgBuilder();
  const result = builder.value('value').emit();
  console.log(result);
  assertEquals(result, '\x1b[36mvalue\x1b[39m');
});
Deno.test('path', () => {
  const builder = new MsgBuilder();
  const result = builder.path('path').emit();
  console.log(result);
  assertEquals(result, '\x1b[34mpath\x1b[39m');
});
Deno.test('date', () => {
  const builder = new MsgBuilder();
  const result = builder.date('date').emit();
  console.log(result);
  assertEquals(result, '\x1b[36mdate\x1b[39m');
});
Deno.test('warn', () => {
  const builder = new MsgBuilder();
  const result = builder.warn('warn').emit();
  console.log(result);
  assertEquals(result, '\x1b[33mwarn\x1b[39m');
});
Deno.test('error', () => {
  const builder = new MsgBuilder();
  const result = builder.error('error').emit();
  console.log(result);
  assertEquals(result, '\x1b[31merror\x1b[39m');
});
