#!/usr/bin/env node
/*****************************************************************************
 * helloworld1.js
 * Copyright 2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

var log = require('../index').start().getLogger();

log.info("Hello world");
