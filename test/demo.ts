import { AppTimer, LogManager } from '../src';

const appTimer = new AppTimer();

const logMgr = new LogManager({ timer: appTimer }).levelThreshold('debug');

const logger = logMgr.getLogger('test');

logger.info('Hello, world!').emit();
