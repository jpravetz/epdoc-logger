/*****************************************************************************
 * config.js
 * CONFIDENTIAL Copyright 2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/

/*
 * cli-config.js: Config that conform to commonly used CLI logging levels.
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

module.exports = {
  levels: {
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
  },

  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    help: 'cyan',
    data: 'grey',
    info: 'green',
    debug: 'blue',
    prompt: 'grey',
    verbose: 'cyan',
    input: 'grey',
    silly: 'magenta'
  }
};
