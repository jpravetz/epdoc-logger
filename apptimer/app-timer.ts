import { dateUtil, type HrSeconds, type Milliseconds } from '@epdoc/timeutil';
import { HrMilliseconds } from './../dist/src/lib/app-timer.d';

export type TimePrefix = 'local' | 'utc' | 'elapsed' | 'interval' | string | false;

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
  protected _hrStartTime: HrMilliseconds;
  /**
   * The application start date.
   */
  protected _startDate: Date;
  /**
   * The interval start time in high resolution milliseconds.
   */
  protected _hrStartInterval: HrMilliseconds;

  protected _freeze: AppTimerValues | undefined;

  /**
   * Initializes the AppTimer with the current time or with the provided arguments.
   * @param args - The arguments to initialize the AppTimer. Can be a Date, a number (milliseconds), or another AppTimer.
   */
  constructor(...args: unknown[]) {
    this._hrTime = Record<String, HrMilliseconds>;
    this._hrStartTime = this.now();
    this._hrStartInterval = this._hrStartTime;
    this._startDate = new Date();
    args.forEach((arg) => {
      if (arg instanceof Date) {
        this._startDate = arg;
        this._hrStartTime = arg.getTime();
        this._hrStartInterval = this._hrStartTime;
      } else if (typeof arg === 'number') {
        this._hrStartTime = arg;
        this._startDate = new Date(this._hrStartTime);
        this._hrStartInterval = this._hrStartTime;
      } else if (arg instanceof AppTimer) {
        this._startDate = arg._startDate;
        this._hrStartTime = arg._hrStartTime;
        this._hrStartInterval = arg._hrStartInterval;
      }
    });
  }

  protected now(): HrMilliseconds {
    return performance.now();
  }

  get startTime(): HrMilliseconds {
    return this._hrStartTime;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get intervalStart(): HrMilliseconds {
    return this._hrStartInterval;
  }

  get intervalElapsed(): HrMilliseconds {
    return this.now() - this._hrStartInterval;
  }

  get totalElapsed(): HrMilliseconds {
    return this.now() - this._hrStartTime;
  }

  /**
   * Resets both the start time and last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetAll(): this {
    this._startDate = new Date();
    this._hrStartTime = this.now();
    this._hrStartInterval = this._hrStartTime;
    return this;
  }

  /**
   * Resets only the last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetInterval(): this {
    this._hrStartInterval = this.now();
    return this;
  }

  /**
   * Measures the elapsed time since the start and last measurement.
   * @returns {AppTimerValues} An object containing total and interval elapsed times in milliseconds.
   */
  sample(): AppTimerValues {
    const now: HrMilliseconds = this.now();
    this._freeze = {
      now: new Date(),
      total: now - this._hrStartTime,
      interval: now - this._hrStartInterval,
    };
    return this._freeze;
  }

  get intervalElapsedAsString(): string {
    return formatTime(this.intervalElapsed);
  }

  get totalElapsedAsString(): string {
    return formatTime(this.totalElapsed);
  }

  getTimeForPrefix(timePrefix: TimePrefix | undefined): string {
    if (timePrefix === 'elapsed') {
      return this.totalElapsedAsString;
    } else if (timePrefix === 'interval') {
      return this.intervalElapsedAsString;
    } else if (timePrefix === 'utc' && this._freeze) {
      return this._freeze.now.toISOString();
    } else if (timePrefix === 'local' && this._freeze) {
      return dateUtil(this._freeze.now).toISOLocalString();
    }
    return '0';
  }
}
