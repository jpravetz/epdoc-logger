import { Milliseconds } from '@epdoc/timeutil';

export type Microseconds = number;

/**
 * Represents the elapsed time since the start of the program with total and
 * delta properties, where delta is the time since the last call to elapsedTime.
 */
export type AppTimerValues = {
  total: Milliseconds;
  interval: Milliseconds;
};

export type AppTimerStrings = {
  total: string;
  interval: string;
};

function formatTime(time: Milliseconds): string {
  return time.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/**
 * Measures elapsed time with total and interval properties. Measures in
 * microseconds.
 */
export class AppTimer {
  protected _startTime: Microseconds;
  protected _lastMeasurement: Microseconds;

  constructor(startTime: Microseconds = performance.now()) {
    this._startTime = startTime;
    this._lastMeasurement = this._startTime;
  }

  protected now(): Microseconds {
    return performance.now();
  }

  get startTime(): Microseconds {
    return this._startTime;
  }

  set startTime(value: Microseconds | Date | undefined) {
    if (typeof value === 'number') {
      this._startTime = value;
    } else if (value instanceof Date) {
      this._startTime = value.getTime();
    } else if (value === undefined) {
      this._startTime = this.now();
    }
  }

  /**
   * Resets both the start time and last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetAll(): this {
    this._startTime = this.now();
    this._lastMeasurement = this._startTime;
    return this;
  }

  /**
   * Resets only the last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetInterval(): this {
    this._lastMeasurement = this.now();
    return this;
  }

  /**
   * Measures the elapsed time since the start and last measurement.
   * @returns {AppTimerValues} An object containing total and interval elapsed times in milliseconds.
   */
  measure(): AppTimerValues {
    const now: Microseconds = this.now();
    const result = {
      total: (now - this._startTime) / 1000,
      interval: (now - this._lastMeasurement) / 1000
    };
    this._lastMeasurement = now;
    return result;
  }

  /**
   * Measures the elapsed time and returns it as formatted strings.
   * @returns {AppTimerStrings} An object containing formatted total and interval elapsed times.
   */
  measureFormatted(): AppTimerStrings {
    const result = this.measure();
    return {
      total: formatTime(result.total),
      interval: formatTime(result.interval)
    };
  }
}

/**
 * Measures elapsed time with total and interval properties. Measures in
 * microseconds. Initialized at construction.
 */
export const appTimer = new AppTimer();
