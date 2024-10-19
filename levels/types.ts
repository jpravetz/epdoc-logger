/**
 * @fileoverview This module defines types and interfaces for log levels used in the logging library.
 * It provides a structure for custom log levels and their associated methods.
 */

/**
 * Represents the name of a log level.
 */
export type LevelName = string;

/**
 * Represents the numeric value of a log level.
 */
export type LogLevel = number;

/**
 * Log levels interface used throughout the library, allowing for custom log
 * levels. A default implementation is provided by the `LogLevels` class, and is
 * accessed via the `DEFAULT_LOG_LEVELS_FACTORY_METHOD` constant.
 *
 * The Logger class implements methods for each log level (info, debug, etc..)
 * for each of the default logger levels. If you are using custom log levels,
 * you will need to subclasss the Logger class and implement the methods for
 * your log levels.
 */
export interface ILogLevels {
  /**
   * The array of log level names that are supported by the logger. These names
   * will be uppercased.
   * @type {LevelName[]}
   */
  names: LevelName[];
  // levelDefs: LogLevelDef;
  /**
   * Converts a log level name to its corresponding numeric value.
   * @param {LevelName} level - The name of the log level to convert.
   * @returns {LogLevel} The numeric value of the log level.
   */
  asValue(level: LevelName | LogLevel): LogLevel;

  /**
   * Converts a numeric log level value to its corresponding name.
   * @param {LogLevel} level - The numeric value of the log level to convert.
   * @returns {LevelName} The name of the log level.
   */

  asName(level: LevelName | LogLevel): LevelName;
  /**
   * The name of the default log level. Usually this is "INFO"
   * @type {LevelName}
   */
  defaultLevelName: LevelName;

  /**
   * Checks if a log level meets a specified threshold.
   * @param {LogLevel} level - The log level to check.
   * @param {LogLevel} threshold - The threshold to compare against.
   * @returns {boolean} True if the log level is above the threshold, false otherwise.
   */
  meetsThreshold(level: LogLevel | LevelName, threshold: LogLevel | LevelName): boolean;

  /**
   * Checks if a log level should result in a flush.
   * @param {LevelName} level - The log level to check.
   * @returns {boolean} True if the log level is above the threshold, false otherwise.
   */
  meetsFlushThreshold(level: LogLevel | LevelName): boolean;

  /**
   * Applies color formatting, if any, to a log message based on its level.
   * @param {string} msg - The message to format.
   * @param {LevelName} level - The log level associated with the message.
   * @returns {string} The formatted message with color applied.
   */
  applyColors(msg: string, level: LevelName): string;
}

export type LogLevelFactoryMethod = () => ILogLevels;
