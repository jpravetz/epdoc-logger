import * as Log from '../src';

const appTimer = new Log.AppTimer();

const logMgr = new Log.LogMgr().timer(appTimer).level('debug');

const logger = logMgr.getLogger('test');

logger.info('Hello, world!').emit();
