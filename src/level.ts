import { asInt, Integer, isDefined, isInteger, isString } from '@epdoc/typeutil';

export type LogLevelDef = Record<string, LogLevelValue>;
export const defaultLogLevelDef: LogLevelDef = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  trace: 6,
  skip: 9
} as const;

export type LogLevelName = keyof typeof defaultLogLevelDef;
export type LogLevelValue = Integer;

export class LogLevel {
  protected _levelDef: LogLevelDef;
  protected _levelValues: Integer[] = [];
  protected _counter: Record<LogLevelName, Integer>;
  protected _levelThreshold: LogLevelValue;
  protected _errorStackThreshold: LogLevelValue;

  constructor(levelDef: LogLevelDef) {
    this._levelDef = levelDef;
    this._levelValues = Object.values(levelDef);
    this._levelValues.forEach((level) => {
      this._counter[level] = 0;
    });
    this._levelThreshold = this.asValue('info');
    this._errorStackThreshold = this.asValue('debug');
  }

  get levelThreshold(): LogLevelValue {
    return this._levelThreshold;
  }

  get errorStackThreshold(): LogLevelValue {
    return this._errorStackThreshold;
  }

  set levelThreshold(level: LogLevelName | LogLevelValue) {
    this._levelThreshold = this.asValue(level);
  }

  set errorStackThreshold(level: LogLevelName | LogLevelValue) {
    this._errorStackThreshold = this.asValue(level);
  }

  get counter() {
    return this._counter;
  }

  get levels() {
    return Object.keys(this._levelDef);
  }

  get levelDefs() {
    return this._levelDef;
  }

  meetsThreshold(level: LogLevelValue, threshold?: LogLevelValue): boolean {
    if (isDefined(threshold)) {
      return level <= threshold;
    }
    return level <= this._levelThreshold;
  }

  meetsErrorStackThreshold(level: LogLevelValue): boolean {
    return level <= this._errorStackThreshold;
  }

  asValue(level: LogLevelName | LogLevelValue): LogLevelValue {
    if (isInteger(level) && this.isLogLevelValue(level)) {
      return level;
    } else if (isString(level) && this.isLogLevelValue(asInt(level))) {
      return asInt(level) as LogLevelValue;
    } else if (level in this._levelDef) {
      return this._levelDef[level];
    }
  }

  /**
   * Checks if the given value is a valid LogLevel.
   * @param {any} val - The value to check.
   * @returns {boolean} True if the value is a valid LogLevel, false otherwise.
   */
  isLogLevelValue(val: any): val is LogLevelValue {
    return this._levelValues.includes(val);
  }

  isLogLevelName(val: any): val is LogLevelName {
    return isString(val) && isDefined(this._levelDef[val]);
  }

  isLogLevel(val: any): boolean {
    return this.isLogLevelValue(val) || this.isLogLevelName(val);
  }

  /**
   * Checks if the given level meets the threshold.
   * @param level - The level to check.
   * @param threshold - The threshold to compare against.
   * @returns {boolean} True if the level meets the threshold, false otherwise.
   * @deprecated
   */
  static meetsLogThreshold(level: LogLevelValue, threshold: LogLevelValue): boolean {
    return level <= threshold;
  }

  /**
   * Converts a LogLevel or LogLevelValue to a LogLevelValue.
   * If the input is a LogLevel, it returns the corresponding LogLevelValue.
   * If the input is a LogLevelValue, it returns the input.
   * If the input is a string representation of a LogLevelValue, it converts and returns the LogLevelValue.
   * @param {LogLevel | LogLevelValue} level - The LogLevel or LogLevelValue to convert.
   * @returns {LogLevelValue} The converted LogLevelValue.
   */
  asName(level: LogLevelName | LogLevelValue): LogLevelName {
    if (isString(level) && level in this._levelDef) {
      return level;
    } else if (isInteger(level) && this.isLogLevelValue(level)) {
      return Object.keys(this._levelDef).find(
        (key) => this._levelDef[key] === level
      ) as LogLevelName;
    }
  }

  incCounter(level: LogLevelName | LogLevelValue): this {
    const levelValue = this.asValue(level);
    this._counter[levelValue]++;
    return this;
  }
}
