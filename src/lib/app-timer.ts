import { dateUtil, Milliseconds } from '@epdoc/timeutil';

export type HrMilliseconds = number;
export type HrSeconds = number;
/**
 * Represents the elapsed time since the start of the program with total and
 * delta properties, where delta is the time since the last call to elapsedTime.
 */
export type AppTimerValues = {
  now: Date;
  total: HrSeconds;
  interval: HrSeconds;
};

export type AppTimerStrings = {
  utc: string;
  local: string;
  total: string;
  interval: string;
};

function formatTime(time: Milliseconds): string {
  return time.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/**
 * Measures elapsed time with total and interval properties. Measures in
 * microseconds. Initialized at construction. Can be used to measure total time
 * for an application or to measure intervals between events.
 */
export class AppTimer {
  /**
   * The application start time in high resolution milliseconds.
   */
  protected _startTime: HrMilliseconds;
  /**
   * The application start date.
   */
  protected _startDate: Date;
  /**
   * The interval start time in high resolution milliseconds.
   */
  protected _startInterval: HrMilliseconds;

  protected _freeze: AppTimerValues;

  /**
   * Initializes the AppTimer with the current time or with the provided arguments.
   * @param args - The arguments to initialize the AppTimer. Can be a Date, a number (milliseconds), or another AppTimer.
   */
  constructor(...args: any[]) {
    this._startInterval = this.now();
    args.forEach((arg) => {
      if (arg instanceof Date) {
        this._startDate = arg;
      } else if (typeof arg === 'number') {
        this._startTime = arg;
      } else if (arg instanceof AppTimer) {
        this._startDate = arg._startDate;
        this._startTime = arg._startTime;
        this._startInterval = arg._startInterval;
      }
    });
  }

  protected now(): HrMilliseconds {
    return performance.now();
  }

  get startTime(): HrMilliseconds {
    return this._startTime;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get intervalStart(): HrMilliseconds {
    return this._startInterval;
  }

  get intervalElapsed(): HrMilliseconds {
    return this.now() - this._startInterval;
  }

  get totalElapsed(): HrMilliseconds {
    return this.now() - this._startTime;
  }

  /**
   * Resets both the start time and last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetAll(): this {
    this._startDate = new Date();
    this._startTime = this.now();
    this._startInterval = this.now();
    return this;
  }

  /**
   * Resets only the last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetInterval(): this {
    this._startInterval = this.now();
    return this;
  }

  /**
   * Measures the elapsed time since the start and last measurement.
   * @returns {AppTimerValues} An object containing total and interval elapsed times in milliseconds.
   */
  measure(): AppTimerValues {
    const now: HrMilliseconds = this.now();
    this._freeze = {
      now: new Date(),
      total: (now - this._startTime) / 1000,
      interval: (now - this._startInterval) / 1000
    };
    return this._freeze;
  }

  /**
   * Measures the elapsed time and returns it as formatted strings.
   * @returns {AppTimerStrings} An object containing formatted total and interval elapsed times.
   */
  measureFormatted(): AppTimerStrings {
    if (!this._freeze) {
      throw new Error('AppTimer.measureFormatted called before measure()');
    }
    return AppTimer.formatTimerValues(this._freeze);
  }

  static formatTimerValues(values: AppTimerValues): AppTimerStrings {
    return {
      utc: values.now.toISOString(),
      local: dateUtil(values.now).toISOLocaleString(),
      total: formatTime(values.total),
      interval: formatTime(values.interval)
    };
  }
}

/**
 * Measures elapsed time with total and interval properties. Measures in
 * microseconds. Initialized at construction.
 */
export const appTimer = new AppTimer();
