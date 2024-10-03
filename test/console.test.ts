import { LogMgr, TransportOptions } from '../src';

describe('Console', () => {
  describe('Function callback', () => {
    it('Pass', () => {
      let idx = 0;
      const actions = ['logger.transport.add', 'logger.start.success', 'bake', '4'];
      const opts = {
        transports: ['console'],
        console: {
          format: (params, opts) => {
            try {
              let s = 'Output string #' + idx;
              expect(params).toHaveProperty('action', actions[idx]);
              ++idx;
              return s;
            } catch (err) {
              console.error(err);
            }
          }
        }
      };
      const logMgr = new LogMgr();
      return logMgr.start().then(() => {
        const log = logMgr.getLogger('app.console.start');
        log.info('Starting').action('bake').emit();
        log.debug('Running', { a: 2, b: 3 }).data({ c: 4, e: 7 }).action('4').emit();
      });
    });
  });

  describe('String format VISUAL', async () => {
    it('Pass', async () => {
      let idx = 0;
      const actions = ['logger.transport.add', 'logger.start.success', 'bake', '4'];
      const transportOpts: TransportOptions = {
        type: 'console',
        levelThreshold: 'verbose',
        format: {
          type: 'string',
          colorize: true
        }
      };
      const logMgr = new LogMgr().addTransport(transportOpts);
      await logMgr.start();
      const log = logMgr.getLogger('app.console.start');
      log.info('This should be green text').action('bake').emit();
      log.verbose('This should be cyan text').action('verbose').emit();
      log.warn('This should be yellow text').action('warn').emit();
      log.error('Message and levels text should be red').action('test').emit();
      log.debug('This should be blue text', { a: 2, b: 3 }).data({ c: 4, e: 7 }).action('4').emit();
    });
  });

  describe('Custom format VISUAL', () => {
    it('Pass', (done) => {
      let idx = 0;
      let actions = ['logger.transport.add', 'logger.start.success', 'bake', '4'];
      let transportOpts: TransportOptions = {
        type: 'console',
        levelThreshold: 'verbose',
        format: {
          type: 'template',
          template: '${action} ${ts} $c015{message} $c{level}'
        }
      };
      const logMgr = new LogMgr().addTransport(transportOpts);
      logMgr.start();
      const log = logMgr.getLogger('app.console.start');
      log.info('Green leftpad').action('bake').emit();
      log.error('Red leftpad').action('test').emit();
      log.debug('Blue', { a: 2, b: 3 }).data({ c: 4, e: 7 }).action('4').emit();
      done();
    });
  });
});
