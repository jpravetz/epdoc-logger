import * as colors from '@std/fmt/colors';
import { LogLevels, type LogLevelsDef } from './base.ts';
import type { LogLevelFactoryMethod } from './types.ts';

const cliLogLevelDefs: LogLevelsDef = {
  error: { val: 0, fmtFn: colors.red, flush: true },
  warn: { val: 1, fmtFn: colors.yellow },
  help: { val: 2, fmtFn: colors.cyan },
  data: { val: 3, fmtFn: colors.gray },
  info: { val: 4, fmtFn: colors.green },
  debug: { val: 5, fmtFn: colors.blue },
  prompt: { val: 6, fmtFn: colors.gray },
  verbose: { val: 7, fmtFn: colors.cyan },
  input: { val: 8, fmtFn: colors.gray },
  silly: { val: 9, fmtFn: colors.magenta },
} as const;

export const createLogLevels: LogLevelFactoryMethod = () => {
  return new LogLevels(cliLogLevelDefs);
};
