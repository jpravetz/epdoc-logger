import { assertEquals } from '@std/assert';
import { StringEx } from '../message/mod.ts';
import { MsgBuilder } from './mod.ts';

Deno.test('test', () => {
  const builder = new MsgBuilder();
  assertEquals(builder.emit('test'), 'test');
});
Deno.test('display applyColors', () => {
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
    .strikethru('strikethru')
    .warn('warn')
    .error('error')
    .emit();
  console.log(result);
  assertEquals(
    /^.*h1.*h2.*h3.*action.*label.*highlight.*value.*path.*date.*strikethru.*warn.*error.*$/.test(result),
    true
  );
});
Deno.test('display no colors', () => {
  const builder = new MsgBuilder(false);
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
    .strikethru('strikethru')
    .warn('warn')
    .error('error')
    .emit();
  console.log(result);
  assertEquals(result, 'h1 h2 h3 action label highlight value path date strikethru warn error');
});
Deno.test('display elapsed no color', () => {
  const builder = new MsgBuilder(false);
  const result = builder.h1('h1').ewt('end');
  // console.log(result);
  assertEquals(true, /^h1 \([\d\.]+ ms since start\)$/.test(result));
});
Deno.test('display elapsed applyColor', () => {
  const builder = new MsgBuilder(false);
  builder.mark('test');
  const result = builder.value('value').ewt('end', 'test');
  // console.log(result);
  assertEquals(true, /^value \([\d\.]+ ms since test\)$/.test(result));
});
Deno.test('h1', () => {
  const builder = new MsgBuilder();
  const result = builder.h1('h1').emit();
  assertEquals(result, '\x1b[1m\x1b[35mh1\x1b[39m\x1b[22m');
});
Deno.test('h2', () => {
  const builder = new MsgBuilder();
  const result = builder.h2('h2').emit();
  assertEquals(result, '\x1b[35mh2\x1b[39m');
});
Deno.test('h3', () => {
  const builder = new MsgBuilder();
  const result = builder.h3('h3').emit();
  assertEquals(result, '\x1b[32mh3\x1b[39m');
});
Deno.test('action', () => {
  const builder = new MsgBuilder();
  const result = builder.action('action').emit();
  assertEquals(
    StringEx(result).hexEncode(),
    '001b005b00330030006d001b005b00340033006d0061006300740069006f006e001b005b00340039006d001b005b00330039006d'
  );
});
Deno.test('label', () => {
  const builder = new MsgBuilder();
  const result = builder.label('label').emit();
  assertEquals(result, '\x1b[34mlabel\x1b[39m');
});
Deno.test('highlight', () => {
  const builder = new MsgBuilder();
  const result = builder.highlight('highlight').emit();
  assertEquals(
    StringEx(result).hexEncode(),
    '001b005b00390035006d0068006900670068006c0069006700680074001b005b00330039006d'
  );
});
Deno.test('value', () => {
  const builder = new MsgBuilder();
  const result = builder.value('value').emit();
  assertEquals(StringEx(result).hexEncode(), '001b005b00390034006d00760061006c00750065001b005b00330039006d');
});
Deno.test('path', () => {
  const builder = new MsgBuilder();
  const result = builder.path('path').emit();
  assertEquals(result, '\x1b[34mpath\x1b[39m');
});
Deno.test('date', () => {
  const builder = new MsgBuilder();
  const result = builder.date('date').emit();
  assertEquals(StringEx(result).hexEncode(), '001b005b00390036006d0064006100740065001b005b00330039006d');
});
Deno.test('warn', () => {
  const builder = new MsgBuilder();
  const result = builder.warn('warn').emit();
  assertEquals(StringEx(result).hexEncode(), '001b005b00330036006d007700610072006e001b005b00330039006d');
});
Deno.test('error', () => {
  const builder = new MsgBuilder();
  const result = builder.error('error').emit();
  assertEquals(
    StringEx(result).hexEncode(),
    '001b005b0031006d001b005b00390031006d006500720072006f0072001b005b00330039006d001b005b00320032006d'
  );
});
Deno.test('strikethru', () => {
  const builder = new MsgBuilder();
  const result = builder.strikethru('strikethru').emit();
  assertEquals(
    StringEx(result).hexEncode(),
    '001b005b0037006d0073007400720069006b00650074006800720075001b005b00320037006d'
  );
});
