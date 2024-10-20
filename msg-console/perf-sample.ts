import { performance, PerformanceObserver } from 'node:perf_hooks';

const obs = new PerformanceObserver((items) => {
  console.log('obs', items.getEntries()[0].duration);
  // performance.clearMarks();
});
obs.observe({ type: 'measure' });
console.log('start to now', performance.measure('Start to Now').duration);

performance.mark('A');

wait(1000).then(() => {
  console.log('a to now', performance.measure('A to Now', 'A').duration);

  performance.mark('B');
  console.log('A to B', performance.measure('A to B', 'A', 'B').duration);
  performance.clearMarks('B');
  console.log('clear B');
  console.log('A to B', performance.measure('A to B', 'A', 'B'));

  console.log('result', performance.getEntriesByType('measure'));
});

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(function () {
      resolve();
    }, ms);
  });
}
