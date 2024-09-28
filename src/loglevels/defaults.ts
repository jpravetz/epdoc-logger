import { LogLevelDef, LogLevels } from '../level';

const logLevelDefs: LogLevelDef = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  debug: 5,
  prompt: 6,
  verbose: 7,
  input: 8,
  silly: 9
} as const;

export type LogLevelName = keyof typeof logLevelDefs;

export const logLevels = new LogLevels(logLevelDefs);
