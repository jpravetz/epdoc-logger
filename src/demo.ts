import { AppTimer } from './lib/app-timer';
import { defaultLog } from './log-mgr';

const appTimer = new AppTimer();

const logMgr = new defaultLog.Mgr({ timer: appTimer }).level('debug');

const logger = logMgr.getLogger('test');

logger.info('Hello, world!').emit();
