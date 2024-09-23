import { asInt, Integer, isInteger, isString } from '@epdoc/typeutil';

export type LogLevelDef = Record<LogLevelName, LogLevelValue>;
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

export type LogLevelName = string;
export type LogLevelValue = Integer;

export class LogLevel {
  protected _levelDef: LogLevelDef;
  protected _levelValues: Integer[] = [];
  protected _counter: Record<LogLevelName, Integer>;

  constructor(levelDef: LogLevelDef) {
    this._levelDef = levelDef;
    this._levelValues = Object.values(levelDef);
    this._levelValues.forEach((level) => {
      this._counter[level] = 0;
    });
  }

  get counter() {
    return this._counter;
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
