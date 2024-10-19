import { AppTimer } from './app-timer.ts';

Deno.test('AppTimer', () => {
  const now = new Date();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const timer = new AppTimer(nowMidnight);
  const sample = timer.sample();
  console.log('startDate', timer.startDate);
  console.log('sample', sample);
  console.log('     utc', timer.getTimeForPrefix('utc'));
  console.log('   local', timer.getTimeForPrefix('local'));
  console.log(' elapsed', timer.getTimeForPrefix('elapsed'));
  console.log('interval', timer.getTimeForPrefix('interval'));
});
