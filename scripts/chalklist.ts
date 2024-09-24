#!/usr/bin/env -S ts-node --files

import { foregroundColorNames, modifierNames } from 'chalk';

foregroundColorNames.forEach((name) => {
  console.log(name);
});

console.log(modifierNames.includes('bold'));
//=> true

// console.log(foregroundColorNames.includes('pink'));
//=> false
