#!/usr/bin/env node
/*****************************************************************************
 * example1.js
 * Copyright 2016 Jim Pravetz. May be freely distributed under the MIT license.
 *****************************************************************************/
'use strict';

// Get the global logger object

var logMgr = require('../index').getLogManager({sid:false});

// Logger static methods

//logMgr.addTransport( 'file', { path: 'path/to/myfile.log', dateFormat: 'ISO', sid: false } );
logMgr.addTransport('console',{sid:false});
var loggerType = logMgr.getTransports()[0].type();
logMgr.setLevel( 'verbose' );
var startTime = logMgr.getStartTime();                    // Milliseconds

// Get a Logger object for this file or module

var log = logMgr.start().getLogger('MyClassName');

// Instance methods. Each line outputs a message.

log.data('a',1).data('b',[2,3]).info();
log.data({a:1,b:[2,3]}).info("My message");
log.info( "I just want to say %s to the %s", "Hello", "World" );
log.action('obj.update').debug( "We %s formatted messages", "do" );
log.error( new Error("My error") );
log.verbose( "The default is to not output verbose messages, so this will not by default be output" );
log.warn( "Danger Will Robinson, danger" );
log.fatal( "Restarting server in %d seconds", 10 );

// Outputs a new message
log.date();             // Output now's date/time
log.separator();        // Output a line separator

log.log( 'info', "This method %s supports util.format style formating", "also" );

// Enable verbose messages to be output for this log object (overrides global setting)
log.setLevel( "verbose" );
